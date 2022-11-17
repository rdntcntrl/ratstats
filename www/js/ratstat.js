const BOT_NAME_PREFIX = '';
// uncomment this to get bot icon in front of bot names:
//const BOT_NAME_PREFIX = '\u{1f916} ';

const USE_LEVELSHOTS = true;


class StatsHelper {

    static locationHashChanged() {
      // window.location.reload(); 
      new RatStat().start()
    }

    static DatePicker(el){
        const input = document.getElementById(el);
        const datepicker = new TheDatepicker.Datepicker(input);
        datepicker.options.setInputFormat('Y-m-d');
        datepicker.options.setDarkMode(true);
        datepicker.render();
    }

    static  escapeHTML(str) {
        return new Option(str).innerHTML;
    }

    static getLocaleDateString(time) {
        var localestr = (navigator.languages || [])[0] || navigator.userLanguage || navigator.language || navigator.browserLanguage || 'en-US'
        return new Date(time).toLocaleDateString(localestr, { year: 'numeric', month: 'numeric', day: '2-digit', minute: '2-digit', hour: '2-digit' })
    }

     static toggleRowBgCSS(idx) {
        return (idx % 2 == 0) ? "bg-gray-800" : "bg-gray-900"
    }

    static  redWon(match) {
        return match.score_blue < match.score_red
    }

    static sort(obj1){
       return Object.keys(obj1).sort().reduce(
            (obj, key) => { 
              obj[key] = obj1[key]; 
              return obj;
            }, 
            {}
          );
    }

    static playerName(player) {
        if (player.isbot) {
            return '<span class="border-gray-200 border rounded text-gray-200 px-1">BOT</span> ' + this.colorString(player.name);
        }
        if (player.isanon) {
            return '<span class="border-blue-200 border rounded text-blue-200 px-1">ANONYMOUS<span>'
        }
        return this.colorString(player.name);
    }

    static colorString(name) {
        var result = document.createElement("span");
        var cname = "^7" + name;
        var splt = [...cname.split(/(\^[0-8])/g)];
        for (var i=1; i < splt.length -1; i += 2) {
            var fragment = document.createElement("span");
            fragment.className = this.numberToColorName(splt[i].substring(1))
            fragment.appendChild(document.createTextNode(splt[i+1]))
            result.appendChild(fragment)
        }
       
        return result.innerHTML;
    }

    static numberToColorName(id) {
        var colors = {
            "0": "text-black",
            "1": "text-red-500",
            "2": "text-lime-500",
            "3": "text-yellow-400",
            "4": "text-indigo-500",
            "5": "text-cyan-500",
            "6": "text-pink-500",
            "7": "text-white",
            "8": "text-orange-600",
        }
        return colors[id]
    }

    static stripColors(str) {
        return str.replaceAll(/\^[0-8]/g, "")
    }

    static timeSince(date) {
        var matchdate = new Date(new Date(date).getTime()  )
        var now = new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60000)
        var seconds = Math.floor((now - matchdate) / 1000);
        var interval = seconds / 86400;
        if (interval > 1) {
          return StatsHelper.getLocaleDateString(matchdate) 
        }
        interval = seconds / 3600;
        if (interval > 1) {
          return Math.floor(interval) + " hours ago";
        }
        interval = seconds / 60;
        if (interval > 1) {
          return Math.floor(interval) + " minutes ago";
        }
        return Math.floor(seconds) + " seconds ago";
    }

    static scrollToTop(){
        $("body").append($('<span class="hidden toTop">back to Top</span>'))
        var el = $('.toTop')
        $(window).scroll(function () {
            ($(this).scrollTop() > 300)?el.fadeIn():el.fadeOut();
        });
        el.click(function () { 
            $('body,html').animate({scrollTop: 0}, 400);
        });
    }

    static formatTime(duration) {
        var hrs = ~~(duration / 3600);
        var mins = ~~((duration % 3600) / 60);
        var secs = ~~duration % 60;
        var ret = "";
        if (hrs > 0) {
            ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
        }
        ret += "" + mins + ":" + (secs < 10 ? "0" : "");
        ret += "" + secs;
        return ret;
    }

    // sanitize map name for url usage
    static sanitizeMapName(map){
        return map.replaceAll(/[^a-z0-9+_-]/g, "")
    }

    static getMapImagePath(map) {
        var map_fn = this.sanitizeMapName(map)
        return `images/lvlshot/${map_fn}.jpg`
    }
}


class ModalView {
    modal = $("#modal-container");
    modalbg = $("#my-modal")
    _instance = null
    constructor() {
        if (ModalView._instance) {
            return ModalView._instance
        }
        ModalView._instance = this;
        
        this.modal.click(function (el) {
            if(el.target.id == "modal-container")
                ModalView._instance.toggleModal();
        })
    }


    setContent(ctn) {
        this.modal.html(ctn)
        return this
    }
    hide(){
        this.modalbg.css("display", "none");
            this.modal.css("display", "none");
    }

    toggleModal() {
        
        if (this.modalbg.css("display") == "flex") {
            this.modalbg.css("display", "none");
            this.modal.css("display", "none");
            $(".mapname").addClass("blur1")
        } else {
            this.modalbg.css("display", "flex");
            this.modal.css("display", "flex");
            $(".mapname").removeClass("blur1")
        }
        if(this.modal.height()-$("#modal-container div").height()<0){
            $("#modal-container > div").addClass("nocenter")
        } 
    }
}

class FilterView {
    _instance = null
    items = null
    filter={}
    constructor(items,filter=null) {
        this.items= items
        this.filter = filter
        this.start()
        if (FilterView._instance) {
            return FilterView._instance
        }
        FilterView._instance = this;
  
    }

    setFilter(){
        var suffix ="select"
        if(this.filter){
            Object.keys(this.filter).forEach(el=>{
                suffix= el=="date"?"picker":"select"
                $("#"+el+suffix).val(""+this.filter[el]).change()
            })
        }
    }

    start(){
        this.applyFilterBoxState()
        StatsHelper.DatePicker("datepicker")
        this.populateSelectBox("#mapselect",this.items.maps)
        this.populateSelectBox("#serversselect",this.items.servers)
        this.populateSelectBox("#gtselect",this.items.gametypes)
        this.setFilter()
    }

    

    applyFilterBoxState(){
        var fboxstate = localStorage.getItem('filterboxstate')
        if(fboxstate){
            if(fboxstate=="none"){
                $(".filterbox").hide()
                $(".arrow").removeClass("up").addClass("down")
            }
        }else{
            $(".filterbox").hide()
            $(".arrow").removeClass("up").addClass("down")
        }
    }

  

    getFilterSettings(){
       return  {filter:{gt:$("#gtselect").val(),servers:$("#serversselect").val(),map:$("#mapselect").val(),date:$("#datepicker").val()}}
    }
    

    setFilterButtonClick(){
        $(".tableheader").click(el=>{
            $(".filterbox").toggle()
            localStorage.setItem('filterboxstate', $(".filterbox").css("display"));
            if( $(".filterbox").css("display")=="table-row"){
                $(".arrow").removeClass("down").addClass("up")
               
            } else {
                $(".arrow").removeClass("up").addClass("down")
            }
        })
        $("#filterstart").click(el=>{
            new RatStat().saveFilter(this.getFilterSettings())
            new RatStat().start(this.getFilterSettings())    
        })
        $("#filterreset").click(el=>{
            new RatStat().saveFilter({filter:{}})
            new RatStat().start()  
        })
    }

    populateSelectBox(id,elements){
        var $dropdown = $(id);
        $.each(elements, function( key, value) {
            $dropdown.append($("<option />").val(value).text(key));
        });
    }

}

class RatStat {
    
    match = {}
    awardcontainer = {}
    itemcontainer = {}
    instance= null
    gametypeontainer ={}
    matchcontainer = {}
    weaponcontainer =[]
    indexfile="matches.json"
    constructor() {
        if (RatStat._instance) {
            return RatStat._instance
          }
          RatStat._instance = this;
    }
    
    async start(ratobj={filter:null}) {
        var _self = this;
        if(ratobj.file){
            this.indexfile=ratobj.file
        }
        $("#playercards-container").html("")
        var hash = window.location.hash.replace("#", "");
        if (hash != "") {
            await this.loadMatchdata(hash)
            if(this.match!= null)
            new DetailView(this.match)
        } else {
            StatsHelper.scrollToTop()
            new ModalView().hide()
            await this.loadIndexdata()
            var matchlist = new MatchList(_self.matchcontainer)
            var filter1 = this.loadFilter()
            if(typeof filter1 != "undefined")
            matchlist.filter=filter1.filter
            matchlist.render(_self.matchcontainer);
            var fltview= new FilterView({maps:matchlist.maps,servers:matchlist.servernames,gametypes:matchlist.gametypes},matchlist.filter)
            fltview.setFilterButtonClick()
        }
        $('body,html').animate({scrollTop: 0}, 400);
        window.onhashchange = StatsHelper.locationHashChanged;
    }

    getFilter(){
        return this.filter;
    }

    saveFilter(filters){
        localStorage.setItem("filters",JSON.stringify(filters))
    }
    loadFilter(){
        return JSON.parse(localStorage.getItem("filters"))
    }

    getAwards(){
        return this.awardcontainer;
    }

    getItems(){
        return this.itemcontainer;
    }

    setWeapons(data){
        var self = this
        Object.keys(data).forEach(function (key,idx) {
            if (key.startsWith("weapon_")) {
                var tmp = data[key]
                tmp.key = key
                self.weaponcontainer[tmp.weapon_id]=tmp
            }
        })
    }

    getWeapon(no){
        return this.weaponcontainer.filter(el=> el.weapon_id == no)[0];
    }
    getWeaponByName(name){
        return this.weaponcontainer.filter(el=> el.key == name)[0];
    }

    getWeapons(){
        return this.weaponcontainer;
    }

    getAward(name){
        return this.awardcontainer[name];
    }

    getItem(name){
        return this.itemcontainer[name];
    }

    getGameTypes(){
        return this.gametypeontainer;
    }

    static getGameType(number) {
        var gt = new RatStat().getGameTypes()
        return number >= 0 ? gt[number].name : "UNKNOWN"   
    }

    static getGameTypeDesc(number) {
        var gt = new RatStat().getGameTypes()
        return number >= 0 ? gt[number].description : "Unknown"   
    }



    loadIndexdata(hash) {
        var _self = this;
        return new Promise(resolve => {
                $.when(
                    $("#templates").load("./templates/templates.html"),
                    $.getJSON("./"+_self.indexfile, function (data) { _self.matchcontainer = data; }),
                        
                    $.getJSON("./gametypes_map.json", function (data) { _self.gametypeontainer = data; })
                ).then(function () {           
                    resolve(true);
                })
        })
    }

    loadMatchdata(hash) {
        var _self = this;
        return new Promise(resolve => {
            $.when(
                $("#templates").load("./templates/templates.html"),
                $.getJSON("./" + hash + ".json", function (data) { _self.match = data;   })
                .fail(function(event, jqxhr, exception) {this.match=null;window.location.hash="#";//new RatStat().start()
            }),
                $.getJSON("./items_map.json", function (data) { _self.itemcontainer = data;_self.setWeapons(data) }),
                $.getJSON("./awards_map.json", function (data) { _self.awardcontainer = data; }),
                $.getJSON("./gametypes_map.json", function (data) { _self.gametypeontainer = data; })
            ).then(function () {
                console.log("loaded")
                resolve(true);
            })
        })
    }
}

class MatchList {
    matchdata = {}
    filter = null
    maps ={}
    servernames = {}
    gametypes ={}
    _instance = null
       
    constructor(data=null) {
        try{ 
            if(data){
                this.matchdata = data
               
                MatchList._instance = this;
            } else{
                if (MatchList._instance) {
                    return MatchList._instance
                }
            }
            
        }catch(e){
            console.log(e)
            return $("<div>")
        }
    }

    renderMatchList(el) {
        $("#matchcontainer_hidden").html($($("#indexbody").html()))
        $("#matchheader").html("")
        if($("#cbox footer").length==0) $("#cbox").append($($("#footer").html()));
    }

    render(data=null){
        if(data)
        this.matchdata = data
        $("#matchcontainer_hidden").html("")
        this.renderMatchList()
        this.renderMatchRows()
        $("#matchcontainer").html($("#matchcontainer_hidden").html())
    }

    renderMatchRows() {
        var self= this
        var idx = 0
        Object.keys(this.matchdata).reverse().forEach((mtch) => {
            this.maps[this.matchdata[mtch].map]=this.matchdata[mtch].map
            this.maps = StatsHelper.sort(this.maps)
            var svname = StatsHelper.stripColors(this.matchdata[mtch].servername.split("^7|")[0])
            this.servernames[svname]=this.matchdata[mtch].servername.split("^7|")[0]
            this.servernames =  StatsHelper.sort(this.servernames)
            this.gametypes[RatStat.getGameTypeDesc(this.matchdata[mtch].gametype)]=this.matchdata[mtch].gametype
            this.gametypes = StatsHelper.sort(this.gametypes)
            if(self.matchFilter(this.matchdata[mtch])){
                this.renderMatchRow(this.matchdata[mtch], idx, mtch)
                idx++
            }
        })
       
    }

    matchFilter(match){
        if(this.filter){
            var vali = true
            Object.keys(this.filter).forEach(filt=>{
             
                switch(filt){
                    case"map":
                    if(this.filter[filt]=="ALL") break
                        vali =  (vali && match.map==this.filter[filt]) //new FilterView().setFilterButtonClick()
                        break
                    case"servers":
                    if(this.filter[filt]=="ALL") break
                        vali =   vali && match.servername.split("^7|")[0].trim() == this.filter[filt].trim()
                        break
                    case "date":
                    if(this.filter[filt]=="") break
                        vali =   vali && match.time.split("T")[0]==this.filter[filt]
                        break
                    case"gt":
                    if(this.filter[filt]=="ALL") break
                        // compare via description, because Tournament and Multitournament are both
                        // called "Duel" and only appear once in the selectbox
                        vali = vali && RatStat.getGameTypeDesc(match.gametype)
                            == RatStat.getGameTypeDesc(this.filter[filt])
                        break
                }
                if(this.filter[filt]=="ALL" && !vali){
                    return false
                }
            })
            return vali
        } else{
            return true
        }

    }

    renderMatchRow(match, idx, mtch) {
        var elem=  $($('#matchrow').html()).attr("id", "row_" + idx)
        var $wrapperspan =  $($('#matchrow').html())
        $wrapperspan.addClass(StatsHelper.toggleRowBgCSS(idx))
        $($wrapperspan).attr("href","./#" + mtch.split(".")[0] );
        var div = $wrapperspan.find(" div")
        $(div[4]).html(StatsHelper.timeSince(match.time))
        $(div[1]).html(StatsHelper.colorString(match.servername))
        $(div[2]).html(RatStat.getGameTypeDesc(match.gametype))
        $(div[3]).html(match.players)
        if (USE_LEVELSHOTS) {
            $(div[0]).css({ "background-image": "url(" + StatsHelper.getMapImagePath(match.map) + ")" })
        }
        $wrapperspan.find("span.mapname").first().html(StatsHelper.escapeHTML(match.map))
        $wrapperspan.attr("id", "row_" + idx)
        $wrapperspan.appendTo("#matchcontainer_hidden #matchlist");
    }

}

class DetailView {

    matchdata = {}
    instance= null

    templatefnc = {
        "TEAM":function(el){
            el.setTeams()
            if (el.redWon()) {
                new Team("#left_side_team", "red" )
                new Team("#right_side_team", "blue")
            } else {
                new Team("#left_side_team", "blue")
                new Team("#right_side_team", "red")
            }
        },
        "SINGLE":function(el){new Single("#left_side_team", el.getPlayers(0))},
        "DUEL":(function(el){ 
            var duel = el.getPlayers(0)
            el.setDuelScore(duel)
            new Duel("#left_side_team", "#right_side_team", duel)
           el.setEqualizeItemCount()
        })
    }

    constructor(match=null) {
        try{   
            if(match){
                
                this.matchdata = match
                DetailView.instance = this;
                this.render(match)
            } else {
                if (DetailView.instance) {
                     return DetailView.instance
                 }
            }
       
        }catch(e){
            console.log(e)
            return $("<div>")
        }
       
    }


    setEqualizeItemCount(){
        var amount = ($("#losingteam .itembox").length - $("#winningteam .itembox").length)/2
        var elem,dest
        if(amount>0){
            dest ="#winningteam"
        } else {
            dest ="#losingteam"
            amount = amount * -1

        }
        for (var i=0;i<=amount;i++){
            elem = $($("#playercard_item_item").html())
            elem.css("visibility","hidden")
            $(dest+" .item_stats").append(elem)
        }
      
    }

    initPlayers(){
        this.matchdata.players.forEach((player, index) => {
            player.index = index;
            if (player.isbot) {
                player.name = BOT_NAME_PREFIX + player.name;
            }
            Object.keys(player.items).forEach((item, index) => {
                if(item.startsWith("weapon_")){
                    var weap = new RatStat().getWeaponByName(item)
                    var res = player.items[item]
                    res = (typeof player.items[weap.ammo] !="undefined")?res+"/"+player.items[weap.ammo]:res+"/0"
                    if(typeof player.weapons[weap.weapon_id] != "undefined")
                    Object.assign(player.weapons[weap.weapon_id], {pickups: res});
                }
                
            });
        });
    }

    render(match){
        this.matchdata = match
        this.initPlayers()
        this.matchdata.matchweapons = this.getMatchWeapons()
        this.matchdata.gametemplate = this.getTemplate(match.gametype)
        $("#matchcontainer_hidden").html("")

        this.renderMatchContainer("#matchcontainer_hidden")
        this.renderMatchContainer("#matchheader", "HEAD")
        this.renderTemplate()
        this.renderMatchInfo(this.matchdata)
        if($("#cbox footer").length==0) $("#cbox").append($($("#footer").html()));
        // reverted to old ugly approach until i figure out a better way 
        document.querySelectorAll("span.plrow").forEach((el2, index) => {
            el2.onclick = function (el1) {
                var element = document.getElementById("playercards-container").children[index].outerHTML
                new ModalView().setContent(element).toggleModal()
            }
        })
        if(this.matchdata.gametype==8){
            $(".w_pick,.h_pick").hide()
        }
        this.equalizeAwardHeight()
    }

    equalizeAwardHeight(){
        var elem
        if($("#card_1 > div:nth-child(5)").height() > $("#card_0 > div:nth-child(5)").height()) {
            elem = $('<div style="visibility:hidden" class="flex justify-center flex-wrap">'+$("#playercard_award_item").html()+"</div>")
            console.log(elem)
            $("#card_0 > div:nth-child(5)").append(elem)
        } else if($("#card_1 > div:nth-child(5)").height() < $("#card_0 > div:nth-child(5)").height()) {
            elem = $('<div style="visibility:hidden" class="flex justify-center flex-wrap">'+$("#playercard_award_item").html()+"</div>")
            
            $("#card_1 > div:nth-child(5)").append(elem)
        } else {
        }
    }

    renderTemplate(){
        $("#playercards-container").html("")
        this.templatefnc[this.matchdata.gametemplate](this)
    
    }

    redWon(){
        return StatsHelper.redWon(this.matchdata)
    }

    setDuelScore(duel){
        let weapon = Object.keys(duel[0].weapons).concat(Object.keys(duel[1].weapons)).sort()
        this.matchdata.matchweapons = [...new Set(weapon)]
        this.matchdata.score_blue = duel[1].score
        this.matchdata.score_red = duel[0].score
    }

    getTemplate(number) {
        var gt = new RatStat().getGameTypes()
        return number >= 0 ? gt[number].template : "TEAM" 
    }

    getMatchData(){
        return this.matchdata
    }

    getMatchWeapons(){
        try {
            return (this.matchdata.matchweapons !=null)?this.matchdata.matchweapons.reduce((a, v) => ({ ...a, [v]: v}), {}):null
        }catch(e){
            return null
        }
        
    }

    getTeam(name){
        return this.matchdata[name]
    }

    teamNeedsFill(name){
        if(this.matchdata.fill>0 && name=="red"){
            return this.matchdata.fill
        }
        else if(this.matchdata.fill<0 && name=="blue"){
            return this.matchdata.fill*-1
        }
        else {
            return 0
        }
    }

    setTeams(){       
        this.matchdata.blue = this.getPlayers(2)
        this.matchdata.red = this.getPlayers(1)
        this.matchdata.fill = this.matchdata.blue.length-this.matchdata.red.length
    }

    getPlayers(no){
            return this.matchdata.players.filter(function (el) { return el.team == no; })
    }

    getMatchGameType() {
      
        return RatStat.getGameType(this.matchdata.gametype)
    }

    renderMatchContainer(el, prefix="") {
        $(el).html()
        var type = prefix + this.matchdata.gametemplate
        $($("#" + type).html()).appendTo($(el));
    }

    
    renderMatchInfo(match) {  
        var scoreright = $("#M_SCORE_RIGHT")
        var scoreleft = $("#M_SCORE_LEFT")
       if (this.matchdata.team_gt || this.matchdata.gametemplate == "DUEL" || this.matchdata.gametemplate == "MULTITOURNAMENT") {
            if (StatsHelper.redWon(match)) {
                scoreright.html(match.score_blue) 
                scoreleft.html(match.score_red) 
                scoreright.addClass("text-blue-600")
                scoreleft.addClass("text-red-700")
            } else {
                scoreright.html(match.score_red) 
                scoreleft.html(match.score_blue) 
                scoreright.addClass("text-red-700")
                scoreleft.addClass("text-blue-600")
            }
        }
        $("#M_SERVER_NAME").html(StatsHelper.colorString(match.servername))
        $("#M_DATE").html(StatsHelper.getLocaleDateString(match.time))
        $("#M_MAP").html(StatsHelper.escapeHTML(match.map))
        $("#M_GAMETYPE").html(RatStat.getGameTypeDesc(match.gametype))
        $("#matchcontainer").html($("#matchcontainer_hidden").html())
    }
    
   
}

class PlayerCard {
    constructor(el, player, duel = false, cname = "") {
        try {
            let template = (duel)?$("#playercardduel"):$("#playercard");
            
            var elem = $($(template.html())) 
            if (duel) $(elem.find("div.bg-gray-700")[1]).addClass(cname)
            $(elem.find("div.bg-gray-700")[0]).addClass(cname)
            this.renderPlayerCardSummary($(elem).find("div.summary_stats"), player);
            this.renderPlayerCardElement($(elem).find("div.award_stats"), player.awards,new RatStat().getAwards(),Award);
            this.renderPlayerCardElement($(elem).find("div.weapon_stats"),player.weapons,new RatStat().getWeapons(),Weapon);
            this.renderPlayerCardElement($(elem).find("div.item_stats"), player.items,new RatStat().getItems(),Item);
            $(elem).find("p").first().html(StatsHelper.playerName(player))
            this.drawBorder(player.team,elem)
            
            elem.attr("id", "card_" + player.index ).appendTo($(el));
            $(".table-cell:contains(---)").addClass("text-gray-500").removeClass("text-white")
        }catch(e){
            console.log(e)
            return $("<div>")
        }
    }


    drawBorder(team,elem){
        if (typeof team != "undefined" && team != 0) {
            const tm = (team == 1) ? " border-red-700" :"border-blue-700"
            $(elem).find("p").parent().addClass( tm)
         } else {
            $(elem).find("p").parent().addClass("border-white-700")
 
         }
    }
    renderPlayerCardSummary(el, player) {
        var hits = 0
        var shots = 0
        Object.keys(player.weapons).map(x => { if (player.weapons[x].shots) { shots += player.weapons[x].shots; hits += player.weapons[x].hits } })
        var acc = (Math.round(hits * 100 / (shots > 0 ? shots : hits))).toString()
        acc = (acc=="NaN")?"0":acc
        el.append(new SummaryStat("Score", player.score));
        el.append(new SummaryStat("kdr", (player.kills / (player.deaths > 0 ? player.deaths : 1)).toFixed(1)));
        el.append(new SummaryStat("Kill/Death", player.kills + "/" + player.deaths));      
        el.append(new SummaryStat("dmg given/taken", player.damage_given + "/" + player.damage_taken));
        el.append(new SummaryStat("Acc", acc+ "%"));
        el.append(new SummaryStat("Hits/Shots", hits + "/" + shots));
    }
    
    renderPlayerCardElement(el, items ,sortby,renderObj) {
        var weaplist = new DetailView().getMatchWeapons()
        if(renderObj == Weapon && weaplist !=null ){
            sortby = weaplist
        }
        if(Object.keys(items).length>0){
            Object.keys(sortby).forEach((wp) => {
                if(renderObj == Weapon && weaplist !=null){
                    if(wp.indexOf(items) ){
                        el.append(new renderObj(items[wp], wp));
                    } else {
                        el.append(new renderObj(items[itm], wp));
                    }
                } else{
                    Object.keys(items).forEach((itm,idx)=>{                 
                        if(itm == wp){
                            el.append(new renderObj(items[itm], itm));
                        }
                    })
                }
            })    
        } else {
            $(el).parent().hide();
        }
    } 
}


class PlayerRow {
    constructor(el,player){
        try {
            this.renderPlayerRow(el, player)
        }catch(e){
            return $("<div>")
        }
    }

    renderPlayerRow(el, player) {
        let elem =  $($("#tablerow").html());
        if (typeof player.team != "undefined" && player.team != 0) {
           const tm = (player.team == 1) ? "border-red-700" : "border-blue-700"
           elem.find("div").addClass( tm)
        } else {
            elem.find("div").addClass("border-white-700")

        }
        elem.find("div.PLSCORE").html(player.score)
        elem.find("div.PLNAME").html(StatsHelper.playerName(player))
        elem.find("div.PLDUR").html( StatsHelper.formatTime(player.playtime))
        elem.find("div.PLKD").html(this.renderGameTypeColumn(player))
        elem.attr("id","player_"+player.index)
        elem.addClass("plrow")
        elem.appendTo($(el));
   }

   renderGameTypeColumn(player){
      switch(new DetailView().getMatchGameType()){
        case "ELIMINATION":
            $(".gametypevar").html("Damage")
            return player.damage_given 
        case "CTF":
        case "CTF_ELIMINATION":
            $(".gametypevar").html("C/R/A/D")
            return player.captures + "/" + player.flag_recoveries + "/" + player.assists + "/" + player.defends
        case "ONEFCTF":
            $(".gametypevar").html("C/A/D")
            return player.captures + "/" + player.assists + "/" + player.defends
        case "DOUBLE_D":
            $(".gametypevar").html("C/A/D")
            return player.captures + "/" + player.assists + "/" + player.defends
        case "TREASURE_HUNTER":
                $(".gametypevar").html("TOKENS")
                return player.items.item_redcube?player.items.item_redcube:player.items.item_bluecube
        default:
            return player.kills + "/" + player.deaths
      }
   }
}


class EmptyRow {
    constructor(el,team){
      
        let elem =  $($("#tablerow").html());
        if (typeof team != "undefined" && team != 0) {
           const tm = (team == 1) ? "border-red-700" : "border-blue-700"
           elem.find("div").addClass( tm)
        } else {
            elem.find("div").addClass("border-white-700")

        }
        elem.removeClass("cursor-pointer")
        elem.find("div.PLSCORE").html("&nbsp;")
        elem.find("div.PLNAME").html("&nbsp;")
        elem.find("div.PLDUR").html("&nbsp;")
        elem.find("div.PLKD").html("&nbsp;")
        elem.appendTo($(el));
   }
}

class Weapon {

    weapon=null

    constructor(weap, no) {
        try {
            this.weapon= new RatStat().getWeapon(no)
            let elem =  $($("#playercard_weapon_item").html());
            elem.addClass("wp_" + no)
            let div =  elem.find("div.w_img_div")
            var acc = (no>1)?(Math.round(weap.hits * 100 / (weap.shots > 0 ? weap.shots : weap.hits)) + "%"):"---"
            div.find("img").attr("src",div.find("img").attr("src")+this.weapon.icon)
            div.addClass("rat-tip")
            div.attr("title-new", this.getWeaponDescription())
            elem.find("div.w_acc").html(acc)
            if(typeof weap.kills !="undefined"){
                elem.find("div.w_kills").html((weap.kills>0)?weap.kills:"---")
                elem.find("div.w_kills").show()
                $("div.w_kills").show()
            } else {
                elem.find("div.w_kills").html("---")
            }
            elem.find("div.w_dmg").html(weap.damage)
            var shots =(no>1)?("/" + weap.shots):""
            elem.find("div.w_k_d").html(weap.hits + shots)
            elem.find("div.w_pick").html(weap.pickups)
            return elem;
        }catch(e){
            
            let elem =  $($("#playercard_weapon_empty").html());
       
            elem.addClass("wp_" + no)
            let div =  elem.find("div.w_img_div")
            div.find("img").attr("src",div.find("img").attr("src")+this.weapon.icon)
            div.addClass("rat-tip")
            div.attr("title-new", this.getWeaponDescription())
            return elem
        }
    }

    getWeaponDescription() {
        return this.weapon.name+((this.weapon.description != "")?`: ${this.weapon.description}`:"")
    }
}

class Award {
    item = {}
    constructor(item, name) {
        try{
            this.item= new RatStat().getAward(name)
            let elem =  $($("#playercard_award_item").html());
            let div =elem.find("div").first();
            elem.find("p").first().html(item);
            elem.find("img").first().attr("src",this.getItemIcon());
            //if(this.item.show==false){ div.addClass("hidden")}
            div.addClass("rat-tip") 
            div.attr("title-new", this.getItemDescription())
            return elem;
        }catch(e){
            return $("<div>")
        }
    }

    getItemIcon() {
        return `images/medals/${this.item.icon}`
    }

    getItemDescription() { 
        var text = ""+this.item.name+""
        if(this.item.description != ""){
            text +=  `: ${this.item.description}`
        }
        return text
    }
}

class Item {
    item=null
   
    constructor(amount, name) {
        try{
            this.item = new RatStat().getItem(name)
           if(name.startsWith("ammo") || name.startsWith("weapon")){
                return
            }
            let elem =  $($("#playercard_item_item").html());    
            let div = elem.find("div").first();
            elem.find("p").html(amount);
            elem.find("img").attr("src",this.getItemIcon());
              
            div.first().addClass("rat-tip")
            div.attr("title-new", this.getItemDescription())
            return elem;
        }catch(e){
            return $("<div>")
        }
    }

    getItemIcon() {
        return `images/icons/${this.item.icon}`
    }

    getItemDescription() { 
        var text = ""+this.item.name+""
        if(this.item.description != ""){
            text +=  `: ${this.item.description}`
        }
        return text
    }
}

class SummaryStat {
     constructor(key, val) {
        const elem =  $($("#playercard_summary_item").html());
        let p = elem.find("p")
        p.first().html( val)
        p.last().html( key)
        return elem;
    }
}

class Duel {
    
    constructor(el, el1, players) {
        if (new DetailView().redWon()) {
            new PlayerCard(el, players[0], true, "border-red-700 border-l-4");
            new PlayerCard(el1, players[1], true, "border-blue-700 border-r-4");
        } else {
            new PlayerCard(el, players[1], true, "border-blue-700 border-l-4");
            new PlayerCard(el1, players[0], true, "border-red-700 border-r-4");
        }
       
    }
}

class Team {
    constructor(el, team) { 
       
        var players = new DetailView().getTeam(team)  
        players.forEach(pl => {
            new Player(el, pl);
        })
    
        for(var i = 0;i<new DetailView().teamNeedsFill(team);i++){
            new EmptyRow(el, players[0].team);
        }
        
    }    
}

class Single {
    
    constructor(el) { 
        var players = new DetailView().getPlayers(0)  
        players.forEach(pl => {
            new Player(el, pl);
        })
    }    
}

class Player{
    constructor(el, player,idx) {
        new PlayerRow(el, player,idx);
        new PlayerCard($("#playercards-container"), player,idx);
    }
}
