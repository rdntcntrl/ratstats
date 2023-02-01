#!/usr/bin/env python3

import oaquery

from sortedcollections import ValueSortedDict

# python3-inotify
import inotify.adapters

import subprocess
import os
import sys
import time
import json
import hashlib
from datetime import datetime,timedelta
from pathlib import Path
import argparse

DELETE_ORPHANS_OLDER_THAN = 5*60*60
DELETE_FAILURES_OLDER_THAN = 5*60*60
REMOVE_OLD_MATCHES_AFTER = timedelta(days=25)
REMOVE_OLD_MATCHES_CHECKPERIOD = 60*60

PERIODIC_CHECK_SECONDS = 600

# production settings
JSON_INDENT = None
ANONYMIZE_BASED_ON_PLAYER_PREFERENCE = True
DISCARD_GAMES_WITH_ONLY_ANONS = False
FSYNC = True

# debug settings
#JSON_INDENT = 4
#ANONYMIZE_BASED_ON_PLAYER_PREFERENCE = False
#FSYNC = False



def delete_file_or_complain(filename):
    print(f"deleting {filename}", file=sys.stderr)
    try:
        os.remove(filename)
    except Exception as err:
        print(f"Error while trying to delete {filename}: {err=}, {type(err)=}", file=sys.stderr)

def tmpbasename(basename):
    return '.' + basename + '.tmp'

class WebStatsDir:
    def __init__(self, directory):
        self.directory = Path(directory)
        self.load()
        self.remove_old_matches()

    def load(self):
        print(f"loading web stats from {self.directory}", file=sys.stderr)
        self.index = ValueSortedDict(lambda entry: entry['time'])
        with os.scandir(self.matchdir_path()) as it:
            for entry in it:
                if not entry.is_file():
                    continue
                if entry.name.startswith('.') and entry.name.endswith('.json.tmp'):
                    delete_file_or_complain(entry.path)
                    continue
                if entry.name.startswith('.') or not entry.name.endswith('.json'):
                    continue
                self.add_or_delete_match(entry.name, entry.path)
        self.update_indexfile()

    def add_or_delete_match(self, filename, matchjson):
        try:
            stats = WebMatchStats.from_web_game_statsfile(matchjson)
            self.add_match(filename, stats)
        except Exception as err:
            print(f"Error while trying to load web match json {matchjson}: {err=}, {type(err)=}", file=sys.stderr)
            delete_file_or_complain(matchjson)

    def add_and_write_match(self, matchstats):
        ## not the most elegant, but since server name + timestamp are in there
        ## we'll always get a unique filename for every match
        ## TODO: replace this naming scheme with something more sensible
        jsondata = matchstats.to_json().encode()
        #h = hashlib.sha256()
        #h.update(jsondata)
        #filename = h.hexdigest() + ".json"
        filename = matchstats.build_filename()

        tmppath = self.matchdir_path() / tmpbasename(filename)
        with open(tmppath, "w+b") as f:
            f.write(jsondata)
            if FSYNC:
                f.flush()
                os.fsync(f.fileno())
        os.replace(tmppath, self.matchdir_path() / filename)
        self.add_match(filename, matchstats)
        self.update_indexfile()

    def add_match(self, filename, matchstats):
        self.index["{}/{}".format(self.matchdir(), filename)] = matchstats.to_indexentry()

    def update_indexfile(self):
        print(f"updating indexfile {self.indexfile_path()}", file=sys.stderr)
        with open(self.indexfile_tmppath(), "w+") as f:
            json.dump(self.index, f, indent=JSON_INDENT, sort_keys=False)
            if FSYNC:
                f.flush()
                os.fsync(f.fileno())
        os.replace(self.indexfile_tmppath(), self.indexfile_path())

    def remove_old_matches(self):
        to_remove = []
        removetime = datetime.now() - REMOVE_OLD_MATCHES_AFTER
        for filename, entry in self.index.items():
            dt = datetime.fromisoformat(entry['time'])
            if dt > removetime:
                break
            to_remove.append(filename)
        if len(to_remove) == 0:
            return
        print(f"deleting old matches {to_remove}", file=sys.stderr)
        for filename in to_remove:
            del self.index[filename]
        self.update_indexfile()
        for filename in to_remove:
            delete_file_or_complain(self.directory / filename)

    def matchdir(self):
        return 'matches'

    def indexfile(self):
        return 'matches.json'

    def matchdir_path(self):
        return self.directory / self.matchdir()

    def indexfile_path(self):
        return self.directory / self.indexfile()

    def indexfile_tmppath(self):
        return self.directory / tmpbasename(self.indexfile())

# converts to unicode characters
def fixup_oa_string(s):
    # probably should put this in oaquery
    return ''.join((oaquery._arena_printable_char(c) for c in s))

def sanitize_map_name(s):
    return ''.join((c for c in s if c.isalpha() or c.isdigit() or c == '_'
                    or c == '+' or c == '-'))

class WebMatchStats:
    def __init__(self, stats):
        self.stats = stats
        self.serverid = None

    def learn_serverid(self):
        if 'serverid' in self.stats:
            self.serverid = self.stats['serverid']
        else:
            self.serverid = 'unknown'

    @classmethod
    def from_stdin(cls):
        return WebMatchStats(json.load(sys.stdin))

    @classmethod
    def from_file(cls, json_filename):
        with open(json_filename) as f:
            return WebMatchStats(json.load(f))

    @classmethod
    def from_web_game_statsfile(cls, json_filename):
        return WebMatchStats.from_file(json_filename)

    @classmethod
    def from_raw_game_statsfile(cls, json_filename):
        stats = WebMatchStats.from_file(json_filename)
        stats.learn_serverid()
        stats.fixup_stats()
        if not stats.is_valid():
            return None
        return stats


    def to_json(self):
        return json.dumps(self.stats, indent=JSON_INDENT, sort_keys=False)

    def fixup_oastrings(self):
        self.stats['servername'] = fixup_oa_string(self.stats['servername'])
        for player in self.stats['players']:
            player['name'] = fixup_oa_string(player['name'])

    def fixup_normalize(self):
        self.stats['map'] = self.stats['map'].lower()

    def fixup_map(self):
        self.stats['map'] = sanitize_map_name(self.stats['map'])

    def fixup_tracking(self):
        for player in self.stats['players']:
            player['isanon'] = False

            if 'trackconsent' in player:
                trackconsent = True if player['trackconsent'] == 1 else False
                del player['trackconsent']
            else:
                trackconsent = False

            if player['isbot']:
                continue

            if not trackconsent and ANONYMIZE_BASED_ON_PLAYER_PREFERENCE:
                #player['name'] = '\U0001f47b Unknown Player \U0001f47b' # ghost
                player['name'] = 'Unknown Player'
                player['isanon'] = True

    def fixup_serverid(self):
        if 'serverid' in self.stats:
            del self.stats['serverid']

    def fixup_stripunused(self):
        if 'exit_reason' in self.stats:
            del self.stats['exit_reason']
        if 'capturelimit' in self.stats:
            del self.stats['capturelimit']
        if 'fraglimit' in self.stats:
            del self.stats['fraglimit']

    def fixup_stats(self):
        self.fixup_normalize()
        self.fixup_oastrings()
        self.fixup_map()
        self.fixup_tracking()
        self.fixup_serverid()
        self.fixup_stripunused()

    def is_valid(self):
        gametype = oaquery.Gametype(self.stats['gametype'])
        if (self.stats['team_gt']
                or gametype == oaquery.Gametype.TOURNAMENT
                or gametype == oaquery.Gametype.MULTITOURNAMENT):
            if len(self.stats['players']) < 2:
                # team or duel games with only 1 player cannot be rendered on the
                # stats page, just discard them
                print("Game is a duel or team game with < 2 players", file=sys.stderr);
                return False
        if DISCARD_GAMES_WITH_ONLY_ANONS and self.num_humans() == self.num_anons():
            print("Game with only anons", file=sys.stderr);
            return False
        return True
    
    def num_humans(self):
        return sum((1 for p in self.stats['players'] if not p['isbot']))

    def num_anons(self):
        return sum((1 for p in self.stats['players'] if not p['isbot'] and not p['isanon']))

    def to_indexentry(self):
        return {
                "servername": self.stats['servername'],
                "map": self.stats['map'],
                "players": self.num_humans(),
                "time": self.stats['time'],
                "gametype": self.stats['gametype'],
                }
    
    def build_filename(self):
        if self.serverid is None:
            raise ValueError("Missing serverid")
        dt = datetime.fromisoformat(self.stats['time'])
        dt = dt.strftime("%Y-%m-%dT%H-%M-%S")
        gameid = self.stats['gameId'] if 'gameId' in self.stats else 0

        # just as a failsafe...
        sid = self.serverid.replace('/', '')

        return f"{dt}_{gameid}_{sid}.json"


class StatsProcessor:

    def process_json(self, filename):
        return False
    
    def delete_old_matches(self):
        pass

class WebStatsProcessor(StatsProcessor):
    def __init__(self, webstats):
        self.webstats = webstats

    def process_json(self, filename):
        print("processing {} for webstats".format(filename), file=sys.stderr)
        try:
            stats = WebMatchStats.from_raw_game_statsfile(filename)
            if stats is not None:
                self.webstats.add_and_write_match(stats)
                return True
        except Exception as err:
            print(f"Error while processing json {err=}, {type(err)=}", file=sys.stderr)
        return False

    def delete_old_matches(self):
        self.webstats.remove_old_matches()
    
class TransferStatsProcessor(StatsProcessor):
    def __init__(self, transfercommand):
        self.command = transfercommand

    def process_json(self, filename):
        print("transferring {}".format(filename), file=sys.stderr)
        try:
            stats = WebMatchStats.from_file(filename)
            if stats is None:
                return False
            return self.transfer(stats.to_json().encode())
        except Exception as err:
            print(f"Error while transferring json {err=}, {type(err)=}", file=sys.stderr)
        return False

    def transfer(self, data):
        try:
            subprocess.run(self.command, input=data, check=True, timeout=20)
            return True
        except Exception as e:
            print("error while transferring file: {}".format(e), file=sys.stderr)
        return False



class Server:
    def __init__(self, statspath):
        self.statspath = statspath
        self.processor = None

    def __str__(self):
        return '{}'.format(self.statspath)

    def process_new_stats(self, delete_after_failure=False):
        print(f"checking for new stats files in {self.statspath}", file=sys.stderr)
        done_files = set();
        json_files = set();
        try:
            it = os.scandir(self.statspath)
        except FileNotFoundError as e:
            print(f"error: {self.statspath} {e}", file=sys.stderr)
            return
        else:
            with it:
                for entry in it:
                    if not entry.is_file():
                        continue
                    if entry.name.endswith(".json.done"):
                        done_files.add(entry.name)
                    elif entry.name.endswith(".json"):
                        json_files.add(entry.name)

            for df in done_files.copy():
                done_fname = os.path.join(self.statspath, df)
                jf = df.removesuffix('.done')
                json_fname = os.path.join(self.statspath, jf)
                if self.processor.process_json(json_fname):
                    delete = True
                else:
                    delete = delete_after_failure
                # delete files if processing failed and delete_after_failure = True, or if the files are old
                if not delete:
                    try:
                        stat = os.stat(json_fname, follow_symlinks=False)
                        if time.time() > stat.st_mtime + DELETE_FAILURES_OLDER_THAN:
                            print("removing failed json {}".format(json_fname), file=sys.stderr)
                            delete = True
                    except:
                        delete = True
                if delete:
                    delete_file_or_complain(json_fname)
                    delete_file_or_complain(done_fname)


                done_files.remove(df)
                try:
                    json_files.remove(jf)
                except:
                    pass

            # these json files have no *.done file, they are either still being written to
            # or are orphans from a long time ago. In the latter case, we just remove them
            for incomplete_jf in json_files:
                json_fname = os.path.join(self.statspath, incomplete_jf)
                try:
                    stat = os.stat(json_fname, follow_symlinks=False)
                    if time.time() > stat.st_mtime + DELETE_ORPHANS_OLDER_THAN:
                        print("removing orphaned json {}".format(json_fname), file=sys.stderr)
                        os.unlink(json_fname)
                except:
                    pass


class ServerStatsWatcher:
    def __init__(self, statsprocessor, delete_after_failure):
        self.servers = []
        self.path_to_server = {}
        self.processor = statsprocessor
        self.inotify = inotify.adapters.Inotify(block_duration_s=PERIODIC_CHECK_SECONDS)
        self.delete_after_failure = delete_after_failure
        self.last_olddelete_time = -REMOVE_OLD_MATCHES_CHECKPERIOD

    def add_server(self, server):
        print("adding server {}".format(server))
        server.processor = self.processor
        self.servers += [server]
        self.path_to_server[server.statspath] = server
        self.inotify.add_watch(server.statspath)

    def process_existing_stats(self):
        print("processing already recorded matches from:\n\t" + '\n\t'.join(s.statspath for s in self.servers))
        self.check_all_servers()
    
    def check_all_servers(self):
        for server in self.servers:
            server.process_new_stats(self.delete_after_failure)

    def delete_old_matches(self):
        self.processor.delete_old_matches()

    def periodic_action(self):
        self.check_all_servers()
        if self.last_olddelete_time + REMOVE_OLD_MATCHES_CHECKPERIOD <= time.monotonic():
            self.delete_old_matches()
            self.last_olddelete_time = time.monotonic()


    def watch_and_process_stats(self):
        print("watching directories:\n\t" + '\n\t'.join(s.statspath for s in self.servers))
        last_periodic_wakeup = time.monotonic()
        for event in self.inotify.event_gen(yield_nones=True):
            if event is None:
                if time.monotonic() < last_periodic_wakeup + PERIODIC_CHECK_SECONDS:
                    continue
                last_periodic_wakeup = time.monotonic()
                self.periodic_action()
                continue

            (_, type_names, path, filename) = event

            #print("PATH=[{}] FILENAME=[{}] EVENT_TYPES={}".format(path, filename, type_names))

            if path not in self.path_to_server:
                print("Error: Event from unknown path!", file=sys.stderr)
                continue
            if not filename.endswith(".json.done") or 'IN_CLOSE_WRITE' not in type_names:
                continue

            server = self.path_to_server[path]
            server.process_new_stats(self.delete_after_failure)

def watch_and_process_stats(serverstatdirs, statsprocessor, delete_after_failure):
    watcher = ServerStatsWatcher(statsprocessor, delete_after_failure)

    for path in serverstatdirs:
        watcher.add_server(Server(path))

    # process stats that are already written by the game servers
    watcher.process_existing_stats()
    # process new stats
    watcher.watch_and_process_stats()

def webstats_main(serverstatdirs, webstatdir):
    webstats = WebStatsDir(webstatdir)
    processor = WebStatsProcessor(webstats)
    watch_and_process_stats(serverstatdirs, processor, True)

def transferstats_main(serverstatdirs, transfercommand):
    processor = TransferStatsProcessor(transfercommand)
    watch_and_process_stats(serverstatdirs, processor, False)

def write_statsfile(directory):
    stats = WebMatchStats.from_stdin()
    stats.learn_serverid()
    jsondata = stats.to_json().encode()
    filename = stats.build_filename()
    directory = Path(directory)
    path = directory / filename
    # this is the basic way the game server does it (the mod is quite limited by the engine...)
    with open(path, "w+b") as f:
        f.write(jsondata)
        f.flush()
        os.fsync(f.fileno())
    with open(path.with_suffix('.json.done'), "w+b") as f:
        f.flush()
        os.fsync(f.fileno())

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Monitor Ratmod stats exports, process them and maintain the Ratstats website.')
    parser.add_argument('--webdir', help='output www directory. This is where matches.json and matches/ will be written to.')
    parser.add_argument('-s', '--statsdir', metavar='PATH', action='append',
                        help='add stats export dir to watch.')
    parser.add_argument('--transfercommand', metavar='CMD', nargs=argparse.REMAINDER,
                        help='instead of maintaining the web stats directory, transfer the game stats files to a remote machine. ' +
                        'The file will be written to th CMD stdin.')
    parser.add_argument('--write-statsfile', metavar='PATH',
                        help='write a single game stats file (read from stdin) to a directory, in raw game output format.' +
                        'This can be used to transfer game stats files (e.g. by ssh calling this command on a remote server). ' + 
                        'The target directory should be observed by another statsprocess.')
    args = parser.parse_args()
    if args.write_statsfile is not None:
        write_statsfile(args.write_statsfile)
        sys.exit(0)

    statsdirs = args.statsdir if args.statsdir is not None else []
    if args.webdir is not None:
        webstats_main(statsdirs, args.webdir)
        sys.exit(0)
    if args.transfercommand is not None:
        transferstats_main(statsdirs, args.transfercommand)
        sys.exit(0)
    print("error: missing --webdir", file=sys.stderr)

