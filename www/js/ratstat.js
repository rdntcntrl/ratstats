class StatsHelper {

    static locationHashChanged() {
       window.location.reload(); 
    }
    
    static stripHtml = (unsafe) => {
        return unsafe.replace(/<[^>]*>?/gm, '');
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
    
    static colorName(name,stripcolors=false) {
        var result =  this.stripHtml(name)

        var mtch = [...result.matchAll(/\^([0-9A-Za-z])(.[^\^]*)/g)]
        if(stripcolors){
            try {
                result = result.replaceAll("\.","")
                 mtch.forEach(el => {               
                     result = result.replace(el[0],  el[2]);
                     result = result.replace(/[&\/\\#,+\.()$~%.'":*?<>{}]/g,'_').replace(".","");
                     
                 })
                 result = result.replaceAll(" ","_")
                 $(result).length
            } catch(e){
                return "errorboy"
            }
            
        }else{
            mtch.forEach(el => {
                result = result.replace(el[0], "<font class='" + this.numberToColorName(el[1]) + "'>" + el[2] + "</font>")
            })
        }
       
        return result
    }

    static numberToColorName(id) {
        var colors = {
            "1": "text-red-600",
            "2": "text-green-600",
            "3": "text-yellow-600",
            "4": "text-blue-600",
            "5": "text-blue-300",
            "6": "text-pink-600",
            "7": "text-white",
            "8": "text-orange-500",
            "0": "text-black",
        }
        return colors[id]
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

    static getMapIconTag(map) {
        map = this.stripHtml(map)
        return `<img src="images/lvlshot/${map}.jpg" width="100" height="100"/>`
    }
    
    static getMapImagePath(map) {
         map = this.stripHtml(map)
        return `images/lvlshot/${map}.jpg`
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
        new DetailView().setItemClick()
        return this
    }

    toggleModal() {
        if (this.modalbg.css("display") == "flex") {
            this.modalbg.css("display", "none");
            this.modal.css("display", "none");
        } else {
            this.modalbg.css("display", "flex");
            this.modal.css("display", "flex");

        }
        if(this.modal.height()-$("#modal-container div").height()<0){
            $("#modal-container > div").addClass("nocenter")
        } 
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

    constructor() {
        if (RatStat._instance) {
            return RatStat._instance
          }
          RatStat._instance = this;
    }
    
    async start() {
        var _self = this;
        var hash = window.location.hash.replace("#", "");
        if (hash != "") {
            await this.loadMatchdata(hash)
            new DetailView(_self.match)
        } else {
            await this.loadIndexdata()
            new MatchList(_self.matchcontainer);
        }
        window.onhashchange = StatsHelper.locationHashChanged;
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
                self.weaponcontainer.push(tmp)
            }
        })
    }

    getWeapon(no){
        return this.weaponcontainer[no-1];
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

    loadIndexdata(hash) {
        var _self = this;
        return new Promise(resolve => {
                $.when(
                    $("#templates").load("./templates/templates.html"),
                    $.getJSON("./index.json", function (data) { _self.matchcontainer = data; }),
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
                $.getJSON("./" + hash + ".json", function (data) { _self.match = data; }),
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
    constructor(data) {
        try{ 
            this.matchdata = data
            this.renderMatchList()
            this.renderMatchRows(data)
        }catch(e){
            return $("<div></div>")
        }
    }

    renderMatchList(el) {
        $($("#indexbody").html()).appendTo("#matchcontainer");
    }

    renderMatchRows(matches) {
        Object.keys(matches).reverse().forEach((mtch, idx) => {
            this.renderMatchRow(matches[mtch], idx, mtch)
        })
    }

    getGameType(number) {
        var gt = new RatStat().getGameTypes()
        return number >= 0 ? gt[number].name : "UNKNOWN"   
    }

    renderMatchRow(match, idx, mtch) {
        var $test = $($('#matchrow').html()).attr("id", "row_" + idx).appendTo("#matchlist");
        var $wrapperspan = $("#row_" + idx)
        $wrapperspan.addClass(StatsHelper.toggleRowBgCSS(idx))
        $($wrapperspan).attr("href","./#" + mtch.split(".")[0] );
        var div = $wrapperspan.find(" div")
        $(div[4]).html(StatsHelper.getLocaleDateString(match.time))
        $(div[1]).html(StatsHelper.colorName(match.servername))
        $(div[2]).html(this.getGameType(match.gametype))
        $(div[3]).html(match.players)
        $(div[0]).css({ "background-image": "url(" + StatsHelper.getMapImagePath(match.map) + ")" })
        var span = $wrapperspan.find("span.mapname").first().html(match.map)
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
        })
    }
    constructor(match) {
        try{   
            if (DetailView.instance) {
                return DetailView.instance
            }
            DetailView.instance = this;
            this.matchdata = match
            this.matchdata.matchweapons = null
            this.matchdata.gametemplate = this.getTemplate(match.gametype)
            this.renderMatchContainer("#matchcontainer")
            this.renderMatchContainer("#matchheader", "HEAD")
            this.renderTemplate()
            this.renderMatchInfo(this.matchdata)
            document.querySelectorAll("span.cursor-pointer").forEach((el2, index) => {
                el2.onclick = function (el1) {
                    var element = document.getElementById("playercards-container").children[index].outerHTML
                    new ModalView().setContent(element).toggleModal()
                }
            })
        }catch(e){
            console.log(e)
            return $("<div></div>")
        }
       
    }

    renderTemplate(){
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
            return this.matchdata.matchweapons.reduce((a, v) => ({ ...a, [v]: v}), {})
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

    getGameType(number) {
        var gt = new RatStat().getGameTypes()
        return number >= 0 ? gt[number].name : "UNKNOWN"   
    }

    getMatchGameType() {
      
        return this.getGameType(this.matchdata.gametype)
    }

    renderMatchContainer(el, prefix="") {
        var type = prefix + this.matchdata.gametemplate
        $($("#" + type).html()).appendTo($(el));
    }

    setItemClick(){
        $(document).find(".clickitem").click(el=>{
            if($(document).find("div.item_stats .hidden").length>0){
                $(document).find("div.item_stats .hidden").removeClass("hidden").addClass("hide")
                $(".clickitem").html("less...")
            } else {
                $(document).find("div.item_stats .hide").removeClass("hide").addClass("hidden")
                $(".clickitem").html("more...")
            }
             
         })
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
        $("#M_SERVER_NAME").html(StatsHelper.colorName(match.servername))
        $("#M_DATE").html(StatsHelper.getLocaleDateString(match.time))
        $("#M_MAP").html(match.map)
        $("#M_GAMETYPE").html(this.getGameType(match.gametype))
    }

   
}

class PlayerCard {
    constructor(el, player, resetClass = false, cname = "") {
        try {
            let strippedName = StatsHelper.colorName(player.name,true);
            if ($("#card_"+strippedName).length > 0) {
                strippedName+=$("#card_"+strippedName).length
            }
            let template = $("#playercard");
            if (resetClass) {
                template = $("#playercardduel");
            }
            $(template.html()).attr("id", "card_" +strippedName ).appendTo($(el));
            var elem = $("#card_"+strippedName) 
            if (resetClass) {
                $(elem.find("div.bg-gray-700")[1]).addClass(cname)
            }
            $(elem.find("div.bg-gray-700")[0]).addClass(cname)
        
            this.renderPlayerCardSummary($(elem).find("div.summary_stats"), player);
            this.renderPlayerCardElement($(elem).find("div.award_stats"), player.awards,new RatStat().getAwards(),Award);
            this.renderPlayerCardElement($(elem).find("div.weapon_stats"),player.weapons,new RatStat().getWeapons(),Weapon);
            this.renderPlayerCardElement($(elem).find("div.item_stats"), player.items,new RatStat().getItems(),Item);
            $(elem).find("p").first().html(StatsHelper.colorName(player.name))
            if (typeof player.team != "undefined" && player.team != 0) {
                const tm = (player.team == 1) ? "red" : "blue"
                $(elem).find("p").parent().addClass( " border-" + tm + "-700")
            } else {
                $(elem).find("p").parent().addClass("border-white-700")
    
            }
         
        }catch(e){
            console.log(e)
            return $("<div></div>")
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
    
    static toggleItems(){
        $(document)
    }
    renderPlayerCardElement(el, items ,sortby,renderObj) {
        var weaplist = new DetailView().getMatchWeapons()
        if(renderObj == Weapon && weaplist !=null ){
            sortby = weaplist
        }
        if(Object.keys(items).length>0){
            Object.keys(sortby).forEach((wp) => {
                if(renderObj == Weapon && weaplist !=null){
                    console.log(wp)
                    if(wp.indexOf(items) ){
                        el.append(new renderObj(items[wp], wp));
                    } else {
                        el.append(new renderObj(items[itm], 0));
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
            return $("<div></div>")
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
        if(player.isbot){
            elem.find("div").addClass("border-gray-500")
            elem.find("div").addClass("text-gray-500")
        }
        elem.find("div.PLSCORE").html(player.score)
        elem.find("div.PLNAME").html(StatsHelper.colorName(player.name))
        elem.find("div.PLDUR").html( StatsHelper.formatTime(player.playtime))
        elem.find("div.PLKD").html(this.renderGameTypeColumn(player))
        elem.appendTo($(el));
   }

   renderGameTypeColumn(player){
      switch(new DetailView().getMatchGameType()){
        case "ELIMINATION":
            $(".gametypevar").html("Damage")
            return player.damage_given 
        case "CTF":
        case "CTF_ELIMINATION":
        case "DOUBLE_D":
        case "ONEFCTF":
            $(".gametypevar").html("C/A/D")
            return player.captures + "/" + player.assists + "/" + player.defends
        case "TREASURE_HUNTER":
                $(".gametypevar").html("CUBES")
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
            elem.addClass("wp_"+StatsHelper.colorName(this.weapon.name,true))
            let div =  elem.find("div.w_img_div")
            var acc = (no>1)?(Math.round(weap.hits * 100 / (weap.shots > 0 ? weap.shots : weap.hits)) + "%"):""
            div.html(this.getWeaponIcon())
            div.addClass("rat-tip")
            div.attr("title-new", this.getWeaponDescription())
            elem.find("div.w_acc").html(acc)
            if(weap.kills){
                elem.find("div.w_kills").html(weap.kills)
            } else {
                elem.find("div.w_kills").hide()
                $("div.w_kills").hide()
            }
            elem.find("div.w_dmg").html(weap.damage)
            var shots =(no>1)?("/" + weap.shots):""
            elem.find("div.w_k_d").html(weap.hits + shots)
            return elem;
        }catch(e){
            return $(`<div class="table-row w_row wp_empty" style="visibility: hidden;"><img  class="h-8 w-5" ></div>`)
        }
    }

    getWeaponIcon() {
        return `<img src="images/icons/${this.weapon.icon}" class="h-5 w-5 inline rat-tip" title-new="${this.weapon.name} : ${this.weapon.description}"/>`
    }
    getWeaponDescription() {
        var text = ""+this.weapon.name+""
        if(this.weapon.description != ""){
            text +=  `: ${this.weapon.description}`
        }
        return text
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
            if(this.item.show==false){ div.addClass("hidden")}
            div.addClass("rat-tip") 
            div.attr("title-new", this.getItemDescription())
            return elem;
        }catch(e){
            return $("<div></div>")
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
            let elem =  $($("#playercard_item_item").html());    
            let div = elem.find("div").first();
            elem.find("p").html(amount);
            elem.find("img").attr("src",this.getItemIcon());
            if(!this.item.show){elem.addClass("hidden");}
            div.first().addClass("rat-tip")
            div.attr("title-new", this.getItemDescription())
            return elem;
        }catch(e){
            return $("<div></div>")
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
    constructor(el, player) {
        new PlayerRow(el, player);
        new PlayerCard($("#playercards-container"), player);
    }
}