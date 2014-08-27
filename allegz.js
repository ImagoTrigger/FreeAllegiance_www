// Imago <imagotrigger@gmail.com> JQuery FlexiGrid, SimpleModal & Q-Tip Javascript Impl. for Allegiance Stats & AGC Events 8/10

////////////////////////////////////////
///////////////SHARED///////////////////
////////////////////////////////////////

// Globals
var JSONData = null; 
var AllegModal = null; 
var con = null; //Modal's container once open() is called

// Cache the images for button states and modal dialogs
$.preLoadImages = function() {
 	var cache = [];
	var args_len = arguments.length;
	for (var i = args_len; i--;) {
		var cacheImage = document.createElement('img');
		cacheImage.src = arguments[i];
		cache.push(cacheImage);
	}
}
jQuery.preLoadImages("http://build.allegiancezone.com/AllegSkill/images/ddn.png",
	"http://build.allegiancezone.com/AllegSkill/images/agc-off.png","http://build.allegiancezone.com/AllegSkill/images/allsrv-off.png","http://build.allegiancezone.com/AllegSkill/images/admin-off.png",
	"http://build.allegiancezone.com/AllegSkill/images/info-off.png","http://build.allegiancezone.com/AllegSkill/images/warning-off.png","http://build.allegiancezone.com/AllegSkill/images/error-off.png",
	"http://build.allegiancezone.com/AllegSkill/images/Infolg.png","http://build.allegiancezone.com/AllegSkill/images/Warninglg.png","http://build.allegiancezone.com/AllegSkill/images/Errorlg.png",
	"http://build.allegiancezone.com/AllegSkill/images/AGClg.png","http://build.allegiancezone.com/AllegSkill/images/Allsrvlg.png","http://build.allegiancezone.com/AllegSkill/images/Adminlg.png",
	"http://build.allegiancezone.com/AllegSkill/images/conquest-off.png","http://build.allegiancezone.com/AllegSkill/images/deathmatch-off.png","http://build.allegiancezone.com/AllegSkill/images/flags-off.png",
	"http://build.allegiancezone.com/AllegSkill/images/artifacts-off.png","http://build.allegiancezone.com/AllegSkill/images/prosperity-off.png","http://build.allegiancezone.com/AllegSkill/images/countdown-off.png");

// Store the JSON to a global var
function CacheVariables(data) { JSONData = data; }

// Updates the placeholders with actual data
function UpdateVariables(data) {
	//Events
	if (data.Results) {
		// Straight Up
		$("#event-logline").html(data.Results);
		$("#event-severity-caption").html(data.Severity);
		$("#event-type-caption").html(data.type);
		$("#event-id").html(data.id);
		$("#event-eid").html(data.eid);
		$("#event-localtime").html(data.DateTime);
		$("#event-Context").html(data.Context);
		$("#event-SubjectName").html(data.SubjectName);
		$("#event-ComputerName").html(data.ComputerName);
		$("#event-SubjectID").html(data.Subject);
		$("#event-dbtime").html(data.timeEnter);
		$("#event-Lag").html(data.Lag);
		$("#event-TZ").html(data.TZ);
		// Game relationship
		showEventGameTip(data);

		// Is / Is Nots
		if (data.LogAsNTEvent == "1")
			$("#event-LogAsNTEvent").html("is");
		else
			$("#event-LogAsNTEvent").html("is&nbsp;not");
		if (data.LogAsDBEvent == "1")
			$("#event-LogAsDBEvent").html("is");
		else
			$("#event-LogAsDBEvent").html("is&nbsp;not");
		// Valid / Invalid			
		if (data.Valid)
			$("#event-Valid").html('<span style="color:DarkGreen">VALID</span>');
		else
			$("#event-Valid").html('<span style="color:DarkRed">INVALID</span>');
		// Images			
		$("#event-type-image").html("<img src=http://build.allegiancezone.com/AllegSkill/images/"+data.type+"lg.png>");
		$("#event-severity-image").html("<img src=http://build.allegiancezone.com/AllegSkill/images/"+data.Severity+"lg.png>");
		// Tables		
		$("#event-props").html(Props2Table(data.Props));			
	//Games
	} else if (data.GameDetails && data.GameDetails.gid) {
	
		
		$("#game-dbtime").html('<a title="<center><b><u>MissionParams ID</b></u><br/>'+data.GameDetails.mpid+'" href=#>'+data.GameDetails.timeEnter+'</a></center>');
		$("#game-Context").html('<a title="<center><b><u>Game ID</b></u><br/>'+data.GameDetails.gid+'" href=#>'+data.GameDetails.szGameID+'</a></center>');
		$("#game-Winners").html('<a title="<center><b><u>Team ID</b></u><br/>'+data.GameDetails.nWinningTeamID+'<br/>Click to view the team results</center>" href="#" onclick="ChangeToTeamDetails(this)">'+data.GameDetails.szWinningTeam+'</a>');
		$("#game-Duration").html(data.GameDetails.nDuration);
		
		//true false win conditions
		var wcurl = "http://build.allegiancezone.com/AllegSkill/cgi-bin/wc.cgi?";
		var breg = true;
		if (data.GameDetails.bIsGoalConquest) {
			$("#game-IsConquest").html('<a title="<b><u>Percent Required</b></u><br/>'+data.GameDetails.nGoalConquest+'" href="#">True</a>');
			wcurl += 'GT=Conquest&C='+data.GameDetails.nGoalConquest+'%';
			breg = false;
		} else {
			$("#game-IsConquest").html('False');
			wcurl += 'C=N/A';
		}
		
		if (data.GameDetails.bIsGoalCountdown) {
			$("#game-IsCountdown").html('<a title="<b><u>Timer Minutes</b></u><br/>'+data.GameDetails.nGoalCountdown+'" href="#">True</a>');
			if (breg)
				wcurl += '&GT=Countdown&D='+data.GameDetails.nGoalCountdown;
			else 
				wcurl += '&GT=Custom&D='+data.GameDetails.nGoalCountdown;
		} else {
			$("#game-IsCountdown").html('False');
			wcurl += '&D=N/A';
		}
		
		if (data.GameDetails.bIsGoalTeamKills) {
			$("#game-IsDeathMatch").html('<a title="<b><u>Required Kills</b></u><br/>'+data.GameDetails.nGoalTeamKills+'" href="#">True</a>');
			if (breg)
				wcurl += '&GT=DeathMatch&R='+data.GameDetails.nGoalTeamKills;
			else 
				wcurl += '&GT=Custom&R='+data.GameDetails.nGoalTeamKills;			
		} else {
			$("#game-IsDeathMatch").html('False');
			wcurl += '&R=N/A';
		}
			
		if (data.GameDetails.bIsGoalProsperity) {
			$("#game-IsProsp").html('<a title="<b><u>$ Credits Required</b></u><br/>'+data.GameDetails.fGoalProsperity+'" href="#">True</a>');
			if (breg)
				wcurl += '&GT=Prosperity&P='+data.GameDetails.fGoalProsperity;
			else 
				wcurl += '&GT=Custom&P='+data.GameDetails.fGoalProsperity;			
		} else {
			$("#game-IsProsp").html('False');
			wcurl += '&P=N/A';
		}
		
		if (data.GameDetails.bIsGoalArtifacts) {
			$("#game-IsArtifacts").html('<a title="<b><u># of Artifact Recoveries Required</b></u><br/>'+data.GameDetails.nGoalArtifact+'" href="#">True</a>');
			if (breg)
				wcurl += '&GT=Artifact Run&A='+data.GameDetails.nGoalArtifact;
			else 
				wcurl += '&GT=Custom&A='+data.GameDetails.nGoalArtifact;			
		} else {
			$("#game-IsArtifacts").html('False');
			wcurl += '&A=N/A';
		}
		
		if (data.GameDetails.bIsGoalFlags) {
			$("#game-IsFlags").html('<a title="<b><u># of Flag Captures Required</b></u><br/>'+data.GameDetails.nGoalFlags+'" href="#">True</a>');
			if (breg)
				wcurl += '&GT=Capture the Flag&F='+data.GameDetails.nGoalFlags;
			else 
				wcurl += '&GT=Custom&F='+data.GameDetails.nGoalFlags;			
		} else {
			$("#game-IsFlags").html('False');
			wcurl += '&F=N/A';
		}	
		
		// game options from params
		var gourl = 'http://build.allegiancezone.com/AllegSkill/cgi-bin/go.cgi?MID=0&NT=2&PT=85%20-%20100&SL=Any&TL=Unlimited&SM=Outrageous%209&TM=BigGame%202.5&R=P:NoHomeS&T=High&MC=Medium&A=Normal&MTI=AllegSkill&MT=HiHigher&MS=Small&IM=1&MM=4';
		
		// The image divs
		$("#game-imgs").html('<div style="float:left;width:25%;text-align:left"><a href="#" onclick="TeamsGameDetails(this)" title="<center><b>Click to see final scores</b></center>"><img border="0" id="wcsrc" onmouseout="ShrinkGameImages()" onmouseover="ExpandGameImages()" src="'+wcurl+'" class="resizewc"></a></div><div style="float:left;width:25%;text-align:left"><a href="#" onclick="TeamsGameDetails(this)" title="<center><b>Click to see final scores</b></center>"><img border="0" id="gosrc" onmouseout="ShrinkGameImages()" onmouseover="ExpandGameImages()" src="'+gourl+'" class="resizego"></a></div>');
		
		// Tables
		$("#game-params").html(Params2Table(data.Params));
		
	// Teams
	} else if (data.TeamDetails && data.TeamDetails.tid) {
		$("#team-id").html(data.TeamDetails.tid);
		$("#team-gid").html(data.TeamDetails.gid);
		$("#team-Context").html(data.TeamDetails.szGameID);
		$("#team-nTeamID").html(data.TeamDetails.nTeamID);
		$("#team-szName").html(data.TeamDetails.szName);
		$("#team-nCivID").html(data.TeamDetails.nCivID);
		$("#team-cPlayerKills").html(data.TeamDetails.cPlayerKills);
		$("#team-cBaseKills").html(data.TeamDetails.cBaseKills);
		$("#team-cBaseCaptures").html(data.TeamDetails.cBaseCaptures);
		$("#team-cDeaths").html(data.TeamDetails.cDeaths);
		$("#team-cEjections").html(data.TeamDetails.cEjections);
		$("#team-cFlags").html(data.TeamDetails.cFlags);
		$("#team-cArtifacts").html(data.TeamDetails.cArtifacts);
		$("#team-cConquest").html(data.TeamDetails.nConquestPercent);
		$("#team-cProspBuy").html(data.TeamDetails.nProsperityPercentBought);
		$("#team-cProspDone").html(data.TeamDetails.nProsperityPercentComplete);
		$("#team-Duration").html(data.TeamDetails.nTimeEndured);
		// Pre-formatted using the textcore files on the handler
		//$("#team-Research").html(data.TeamDetails.Research);
		//$("#team-Faction").html(data.TeamDetails.Faction);
		// Dynamic Images
		//$("#team-researchimg").html(data.TeamDetails.researchimg);
		//$("#team-lobbyimg").html(data.TeamDetails.lobbyimg);
	//Players
	} else if (data.PlayerDetails && data.PlayerDetails.pid) {
		$("#player-id").html(data.PlayerDetails.pid);
		$("#player-gid").html(data.PlayerDetails.gid);
		$("#player-cid").html(data.PlayerDetails.CharacterID);		
		$("#player-Context").html(data.PlayerDetails.szGameID);
		$("#player-nTeamID").html(data.PlayerDetails.nTeamID);
		$("#player-szName").html(data.PlayerDetails.szName);
		$("#player-cPlayerKills").html(data.PlayerDetails.cPlayerKills);
		$("#player-cBuilderKills").html(data.PlayerDetails.cBuilderKills);
		$("#player-cMinerKills").html(data.PlayerDetails.cMinerKills);
		$("#player-cLayerKills").html(data.PlayerDetails.cLayerKills);
		$("#player-cBaseKills").html(data.PlayerDetails.cBaseKills);
		$("#player-cBaseCaptures").html(data.PlayerDetails.cBaseCaptures);
		$("#player-cSelfBaseKills").html(data.PlayerDetails.cPilotBaseKills);
		$("#player-cSelfBaseCaptures").html(data.PlayerDetails.cPilotBaseCaptures);
		$("#player-cDeaths").html(data.PlayerDetails.cDeaths);
		$("#player-cEjections").html(data.PlayerDetails.cEjections);
		$("#player-cRescues").html(data.PlayerDetails.cRescues);
		$("#player-cFlags").html(data.PlayerDetails.cFlags);
		$("#player-cArtifacts").html(data.PlayerDetails.cArtifacts);
		$("#player-cTechs").html(data.PlayerDetails.cTechsRecovered);
		$("#player-cAlephs").html(data.PlayerDetails.cAlephsSpotted);
		$("#player-cRoids").html(data.PlayerDetails.cAsteroidsSpotted);
		$("#player-Rating").html(data.PlayerDetails.fCombatRating);
		$("#player-Score").html(data.PlayerDetails.fScore);
		$("#player-Winner").html(data.PlayerDetails.bWin);
		$("#player-WinnerCmd").html(data.PlayerDetails.bWinCmd);
		$("#player-Loser").html(data.PlayerDetails.bLose);
		$("#player-LoserCmd").html(data.PlayerDetails.bLoseCmd);
		$("#player-Duration").html(data.PlayerDetails.nTimePlayed);				
		$("#player-DurationCmd").html(data.PlayerDetails.nTimeCmd);
		// Dynamic Image (medals awarded in the game)
		//$("#player-mvpimg").html(data.TeamDetails.mvpimg);
	// Unknwon
	} else {
		alert("Error: unknown response structure!");
	}
}
// Fades in/out any data in the placeholders, data is passed here only to determine what to show (events, games, etc)
function FadeVariables(speed,opacity,data) {
	//Events
	if (data.Results) {
		$("#event-logline").fadeTo(speed,opacity);
		$("#event-severity-image").fadeTo(speed,opacity);
		$("#event-severity-caption").fadeTo(speed,opacity);
		$("#event-type-image").fadeTo(speed,opacity);
		$("#event-type-caption").fadeTo(speed,opacity);
		$("#event-id").fadeTo(speed,opacity);
		$("#event-gid").fadeTo(speed,opacity);
		$("#event-eid").fadeTo(speed,opacity);
		$("#event-localtime").fadeTo(speed,opacity);
		$("#event-LogAsNTEvent").fadeTo(speed,opacity);
		$("#event-LogAsDBEvent").fadeTo(speed,opacity);
		$("#event-SubjectName").fadeTo(speed,opacity);
		$("#event-ComputerName").fadeTo(speed,opacity);
		$("#event-SubjectID").fadeTo(speed,opacity);
		$("#event-Context").fadeTo(speed,opacity);
		$("#event-dbtime").fadeTo(speed,opacity);
		$("#event-props").fadeTo(speed,opacity);
		$("#event-Lag").fadeTo(speed,opacity);
		$("#event-TZ").fadeTo(speed,opacity);
		$("#event-Valid").fadeTo(speed,opacity);		
	//Games
	} else if (data.GameDetails && data.GameDetails.gid) {		
		$("#game-id").fadeTo(speed,opacity);
		$("#game-mpid").fadeTo(speed,opacity);
		$("#game-wtid").fadeTo(speed,opacity);
		$("#game-Name").fadeTo(speed,opacity);
		$("#game-dbtime").fadeTo(speed,opacity);
		$("#game-Context").fadeTo(speed,opacity);
		$("#game-Winners").fadeTo(speed,opacity);
		$("#game-IsConquest").fadeTo(speed,opacity);
		$("#game-IsCountdown").fadeTo(speed,opacity);
		$("#game-IsDeathMatch").fadeTo(speed,opacity);
		$("#game-IsProsp").fadeTo(speed,opacity);
		$("#game-IsArtifacts").fadeTo(speed,opacity);
		$("#game-IsFlags").fadeTo(speed,opacity);
		$("#game-Conquest").fadeTo(speed,opacity);
		$("#game-Countdown").fadeTo(speed,opacity);
		$("#game-DeathMatch").fadeTo(speed,opacity);
		$("#game-Prosp").fadeTo(speed,opacity);
		$("#game-Artifacts").fadeTo(speed,opacity);
		$("#game-Flags").fadeTo(speed,opacity);
		$("#game-Duration").fadeTo(speed,opacity);
		// Dynamic Images
		$("#game-goimg").fadeTo(speed,opacity);
		$("#game-wcimg").fadeTo(speed,opacity);
		// Tables
		$("#game-params").fadeTo(speed,opacity);	
	//Teams
	} else if (data.TeamDetails && data.TeamDetails.tid) {
		$("#team-id").fadeTo(speed,opacity);
		$("#team-gid").fadeTo(speed,opacity);
		$("#team-Context").fadeTo(speed,opacity);
		$("#team-nTeamID").fadeTo(speed,opacity);
		$("#team-szName").fadeTo(speed,opacity);
		$("#team-nCivID").fadeTo(speed,opacity);
		$("#team-cPlayerKills").fadeTo(speed,opacity);
		$("#team-cBaseKills").fadeTo(speed,opacity);
		$("#team-cBaseCaptures").fadeTo(speed,opacity);
		$("#team-cDeaths").fadeTo(speed,opacity);
		$("#team-cEjections").fadeTo(speed,opacity);
		$("#team-cFlags").fadeTo(speed,opacity);
		$("#team-cArtifacts").fadeTo(speed,opacity);
		$("#team-cConquest").fadeTo(speed,opacity);
		$("#team-cProspBuy").fadeTo(speed,opacity);
		$("#team-cProspDone").fadeTo(speed,opacity);
		$("#team-Duration").fadeTo(speed,opacity);
		// Pre-formatted using the textcore files on the handler
		//$("#team-Research").fadeTo(speed,opacity);
		//$("#team-Faction").fadeTo(speed,opacity);
		// Dynamic Images
		//$("#team-researchimg").fadeTo(speed,opacity);
		//$("#team-lobbyimg").fadeTo(speed,opacity);
	//Players
	} else if (data.PlayerDetails && data.PlayerDetails.pid) {	
		$("#player-id").fadeTo(speed,opacity);
		$("#player-gid").fadeTo(speed,opacity);
		$("#player-cid").fadeTo(speed,opacity);
		$("#player-Context").fadeTo(speed,opacity);
		$("#player-nTeamID").html(data.PlayerDetails.nTeamID);
		$("#player-szName").fadeTo(speed,opacity);
		$("#player-cPlayerKills").fadeTo(speed,opacity);
		$("#player-cBuilderKills").fadeTo(speed,opacity);
		$("#player-cMinerKills").fadeTo(speed,opacity);
		$("#player-cLayerKills").fadeTo(speed,opacity);
		$("#player-cBaseKills").fadeTo(speed,opacity);
		$("#player-cBaseCaptures").fadeTo(speed,opacity);
		$("#player-cSelfBaseKills").fadeTo(speed,opacity);
		$("#player-cSelfBaseCaptures").fadeTo(speed,opacity);
		$("#player-cDeaths").fadeTo(speed,opacity);
		$("#player-cEjections").fadeTo(speed,opacity);
		$("#player-cRescues").fadeTo(speed,opacity);
		$("#player-cFlags").fadeTo(speed,opacity);
		$("#player-cArtifacts").fadeTo(speed,opacity);
		$("#player-cTechs").fadeTo(speed,opacity);
		$("#player-cAlephs").fadeTo(speed,opacity);
		$("#player-cRoids").fadeTo(speed,opacity);
		$("#player-Rating").fadeTo(speed,opacity);
		$("#player-Score").fadeTo(speed,opacity);
		$("#player-Winner").fadeTo(speed,opacity);
		$("#player-WinnerCmd").fadeTo(speed,opacity);
		$("#player-Loser").fadeTo(speed,opacity);
		$("#player-LoserCmd").fadeTo(speed,opacity);
		$("#player-Duration").fadeTo(speed,opacity);
		$("#player-DurationCmd").fadeTo(speed,opacity);
		// Dynamic Image (medals awarded in the game)
		//$("#player-mvpimg").fadeTo(speed,opacity);
	//Unknwon
	} else {
		// Unknwon resposnse data type
	}
}

// Sets the dialog header and description
function SetDialogHeader(title,data,which,nofade) {
	if (nofade) {
		$(which.header).html(data.Name);
		$(which.desc).html(data.Description);
		$(which.title+" span.thetitle").html(title);
		return;
	}
	$(which.title+" span.thetitle").fadeTo("slow",0.001);

	setTimeout(function () {
		$(which.title+" span.thetitle").html(title);
	}, 600);
	setTimeout(function () {
		$(which.title+" span.thetitle").fadeTo("fast",1.0);
	}, 200);
	$(which.header).html(data.Name);
	$(which.desc).html(data.Description);
}

jQuery(function ($) {
	AllegModal = {
		container: null,
		// Loads after the DOM renders
		init: function () {
		
			//hide crap from showing at bottom of screen
		 	$("#event-modal-content").hide();
		 	$("#game-modal-content").hide();
		 	$("#team-modal-content").hide();
		 	$("#player-modal-content").hide();
		 	
		 	// Activate / Update using click handlers
			$("#event-dialog a.raisemodal").click(function (e,id,title) {EventModalRaise(e,id,title)});
			$("#event-dialog a.updatemodal").click(function (e,id,data,title) {EventModalUpdate(e,id,data,title)});
			$("#game-dialog a.raisemodal").click(function (e,id,title) {GameModalRaise(e,id,title)});
			$("#game-dialog a.updatemodal").click(function (e,id,data,title) {GameModalUpdate(e,id,data,title)});	
			$("#team-dialog a.raisemodal").click(function (e,id,title) {TeamModalRaise(e,id,title)});
			$("#team-dialog a.updatemodal").click(function (e,id,data,title) {TeamModalRaise(e,id,data,title)});	
			$("#player-dialog a.raisemodal").click(function (e,id,title) {PlayerModalRaise(e,id,title)});
			$("#player-dialog a.updatemodal").click(function (e,id,data,title) {PlayerModalRaise(e,id,data,title)});				
		},	
		// Displays the header portion of the modal only (with please wait..)
		open: function (d) {
			var self = this;
			con = d;
			var which = WhichModal(d);
			self.container = d.container[0];
			d.overlay.fadeIn('slow', function () {
				$(which.content, self.container).show();
				var title = $(which.title, self.container);
				title.show();
				d.container.slideDown('slow', function () {
					setTimeout(function () {
						var h = $(which.data, self.container).height()
							+ title.height()
							+ 16;
					}, 300);
				});
			});
		},
		// Displays the entire modal and variable data (called when AJAX finishes)
		openFinish: function (d,data) {
			var self = this;
			// The update
			UpdateVariables(data);
			var which = WhichModal(d);
			self.container = d.container[0];
			d.overlay.fadeIn('slow', function () {
				$(which.content, self.container).show();
				var title = $(which.title, self.container);
				title.show();
				d.container.slideDown('slow', function () {
					setTimeout(function () {
						var h = $(which.data, self.container).height()
							+ title.height()
							+ 16;
						d.container.animate(
							{height: h}, 
							200,
							function () {
								$(which.data, self.container).show();
								$("div.close", self.container).show();
							}
						);							
					}, 300);
				});
			});
			setTimeout(function () {
				// The fade
				FadeVariables("slow",1,data);
				$(which.button).fadeTo(1000,1);
			}, 1050);
		},
		//Closes the Modal
		close: function (d) {
			var self = this;
			d.container.animate(
				{top:"-" + (d.container.height() + 16)},
				500,
				function () {
					self.close(); // or $.modal.close();
				}
			);
			
		},
		//Redraws the (new) content
		update: function(d,data) {
			FadeVariables("fast",0.001,data);
			setTimeout(function() {
				UpdateVariables(data);				
			}, 300);
			setTimeout(function() {
				FadeVariables("slow",1,data);
			}, 300);
			var which = WhichModal(d);
			var title = $(which.title, self.container);
			d.container.slideDown('slow', function () {
				setTimeout(function () {
					var h = $(which.data, self.container).height()
						+ title.height()
						+ 16;
					d.container.animate(
						{height: h}, 
						200,
						function () {
							// update done
						}
					);							
				}, 300);
			});			
		}
	};
	
	//Start waiting for modal raise/update click triggers
	AllegModal.init();
});

// Determine which modal styles to use given a container (or told explicitly)
function WhichModal(d,force) {
	var which = { "content" : null, "title" : null, "data" : null, "button" : null, "desc" : null, "header" : null};
	if ((d != null && d.data[0].id == "event-modal-content") || force == "event") {
		which.content = "#event-modal-content";
		which.title = "#event-modal-title";
		which.header = "#event-modal-header";
		which.desc = "#event-modal-desc";
		which.data = "#event-modal-data";
		which.button = "#eventbutton";
	} else if((d != null && d.data[0].id == "game-modal-content") || force == "game") {
		which.content = "#game-modal-content";
		which.title = "#game-modal-title";
		which.header = "#game-modal-header";
		which.desc = "#game-modal-desc";
		which.data = "#game-modal-data";
		which.button = "#gamebutton";
	} else if((d != null && d.data[0].id == "team-modal-content") || force == "team") {
		which.content = "#team-modal-content";
		which.title = "#team-modal-title";
		which.header = "#team-modal-header";
		which.desc = "#team-modal-desc";
		which.data = "#team-modal-data";
		which.button = "#teambutton";
	} else if((d != null && d.data[0].id == "player-modal-content") || force == "player") {
		which.content = "#player-modal-content";
		which.title = "#player-modal-title";
		which.header = "#player-modal-header";
		which.desc = "#player-modal-desc";
		which.data = "#player-modal-data";
		which.button = "#playerbutton";
	}
	return which;
}

// Blows away a grid (and modal) then replaces it with fatalsToBrowser
function UhOh(html,elid) {
	html += "<h2>Please <a href='#' onclick='window.location.reload()'>reload the page</a> try again. If this error persists, please E-mail to imagotrigger@gmail.com!</h2>";
	$(elid).html('<div style="color:DarkRed !important;background-color:white">'+html+'</div>');
	$.modal.close();
}


////////////////////////////////////////
///////////////EVENTS///////////////////
////////////////////////////////////////

var EventMask = 7; //AGC = 1, Allsrv = 2, Admin = 4
var SeverityMask = 7; //Info = 1, Warning = 2, Error = 4
var bAGC = true;
var bAllsrv = true;
var bAdmin = true;
var bInfo = true;
var bWarning = true;
var bError = true;

// Event modal helper used to activate it from inside the grid
function doEventDetails(id) { $("#event-dialog a.raisemodal").trigger('click',["row"+id,'Allegiance AGC Event Details']); }

// Event modal helper used to switch to Game view
function ChangeToGameDetails(id) { 
	alert("+change to game id "+id); 
}


// Event Delete action - Sends D request to handler, passes param'items'
function doEventDelete(com,grid)
{
   	if($('.trSelected',grid).length>0){
   		if(confirm('Delete ' + $('.trSelected',grid).length + ' events?')){
			var items = $('.trSelected',grid);
			var itemlist ='';
			for(i=0;i<items.length;i++){
				itemlist+= items[i].id.substr(3)+",";
			}
			$.ajax({
			   type: "POST",
			   dataType: "json",
			   url: "/AllegSkill/nph-JSONHandler.cgi?R=D&T=EventResults",
			   data: "key=eid&items="+itemlist,
			   success: function(data){
				$("#flexEvents").flexReload();
			   },
			   error: function(xhr,txt,e) {UhOh(xhr.responseText,"#event-dialog");}
			 });
		}
	} else
		return false;
}

// Event Type Filter action - Sets the mask and button image
function doTypeFilter(com)
{
	if (com == "AGC") {
		if (bAGC) {
			EventMask--;
			bAGC = false;
			$('#event-dialog span.agc').css({ 'font-weight': 'normal','background': 'url(http://build.allegiancezone.com/AllegSkill/images/agc-off.png) no-repeat center left'});
		} else {
			EventMask++;
			bAGC = true;
			$('#event-dialog span.agc').css({ 'font-weight': 'bold','background': 'url(http://build.allegiancezone.com/AllegSkill/images/agc.png) no-repeat center left'});
		}
	} else if (com == "Allsrv") {
		if (bAllsrv) {
			EventMask -= 2;
			bAllsrv = false;
			$('#event-dialog span.allsrv').css({ 'font-weight': 'normal','background': 'url(http://build.allegiancezone.com/AllegSkill/images/allsrv-off.png) no-repeat center left'});
		} else {
			EventMask += 2;
			bAllsrv = true;
			$('#event-dialog span.allsrv').css({ 'font-weight': 'bold','background': 'url(http://build.allegiancezone.com/AllegSkill/images/allsrv.png) no-repeat center left'});
		}
	} else {
		if (bAdmin) {
			EventMask -= 4;
			bAdmin = false;
			$('#event-dialog span.admin').css({ 'font-weight': 'normal','background': 'url(http://build.allegiancezone.com/AllegSkill/images/admin-off.png) no-repeat center left'});
		} else {
			EventMask += 4;
			bAdmin = true;
			$('#event-dialog span.admin').css({ 'font-weight': 'bold','background': 'url(http://build.allegiancezone.com/AllegSkill/images/admin.png) no-repeat center left'});
		}
	}
	changeEventFilters();
}

// Event Severity Filter action - Sets the mask and button image
function doSeverityFilter(com)
{
	if (com == "Info") {
		if (bInfo) {
			SeverityMask--;
			bInfo = false;
			$('#event-dialog span.info').css({ 'font-weight': 'normal','background': 'url(http://build.allegiancezone.com/AllegSkill/images/info-off.png) no-repeat center left'});
		} else {
			SeverityMask++;
			bInfo = true;
			$('#event-dialog span.info').css({ 'font-weight': 'bold','background': 'url(http://build.allegiancezone.com/AllegSkill/images/info.png) no-repeat center left'});
		}
	} else if (com == "Warning") {
		if (bWarning) {
			SeverityMask -= 2;
			bWarning = false;
			$('#event-dialog span.warning').css({ 'font-weight': 'normal','background': 'url(http://build.allegiancezone.com/AllegSkill/images/warning-off.png) no-repeat center left'});
		} else {
			SeverityMask += 2;
			bWarning = true;
			$('#event-dialog span.warning').css({ 'font-weight': 'bold','background': 'url(http://build.allegiancezone.com/AllegSkill/images/warning.png) no-repeat center left'});
		}
	} else {
		if (bError) {
			SeverityMask -= 4;
			bError = false;
			$('#event-dialog span.error').css({ 'font-weight': 'normal','background': 'url(http://build.allegiancezone.com/AllegSkill/images/error-off.png) no-repeat center left'});
		} else {
			SeverityMask += 4;
			bError = true;
			$('#event-dialog span.error').css({ 'font-weight': 'bold','background': 'url(http://build.allegiancezone.com/AllegSkill/images/error.png) no-repeat center left'});
		}
	}
	changeEventFilters();
}

// Event Filter reuse helper (Type and Secerity) - Sets the new grid options and reloads
function changeEventFilters() {
	jQuery('#flexEvents').flexOptions({newp:1, params:[{name:'EM',value:EventMask},{name:'SM',value:SeverityMask}]});
	jQuery('#flexEvents').flexReload();
}

// Event divs/tables from a Props Object - created from the handler's call to ObjRef2String.exe
function Props2Table(obj) {
	// header columns
	var out = "<script type=\"text/javascript\">";
	out += "$('#event-modal-body a[title]').qtip({hide: {fixed: true},position: { corner: { target: 'leftMiddle', tooltip: 'rightBottom'} }, style: { name: 'light', tip: true } })</script>";
	out +='<div class="rowdiv">';
	out +='<div class="celldiv_75"><span class="header">AGC&nbsp;Object&nbsp;Values</span></div>';
	out +='<div class="celldiv_25"><span class="header">Key&nbsp;Name</span></div>';
	out +='</div>';	
	var cnt = 0;
	//Keys
	for (var i in obj) {
		//Even / odd
		cnt++;
		if (cnt % 2 == 0)
			out += '<div class="rowdiv even"><div class="celldiv_75 even"><span class="smheav">';
		else
			out += '<div class="rowdiv"><div class="celldiv_75"><span class="smheav">';
		//Values are output first! (Values = Keys)
		for (var j in obj[i]) { 
			//VT_DISPATCH Data
			if (obj[i][j].Data != null && obj[i][j].Interface != null) {
				//a dispatch k=v table
				var dispdata = "<table width=100% align=center><tr><td width=20%><u><b>Key</u></b></td><td width=80%><u><b>Value</u></b></td></tr>";
				for (var k in obj[i][j].Data) {
					dispdata += '<tr><td width=20%><b>'+k+ "</b></td><td width=80%>"+obj[i][j].Data[k]+"</td></tr>";
				}
				dispdata += "</table>";
				//goes into tooltip
				out += '<a href="#" style="cursor:help" title="<center><small><b><u>';
				out += obj[i][j].Interface.GUID+'</b></u></small><br/>';
				out += obj[i][j].Interface.Desc+'<br/>';
				out += dispdata+'</center>">'; //TODO: Wrap long lines /w <br/>
				out += obj[i][j].Interface.IID+'</a>';
			//VT_* Data
			} else {
				//a regular list of values
				out += obj[i][j];
			}
			if (obj[i][j+1] != null)
				out += ", ";
			else
				out += " &nbsp; ";
		}
		out += '</span></div>';
		//Even / odd
		if (cnt % 2 == 0)
			out += '<div class="celldiv_25 even"><span class="smhead even" style="font-weight: bold">';
		else
			out += '<div class="celldiv_25"><span class="smhead" style="font-weight: bold">';
		// Keys are output last
		out += i;
		out += '</span></div></div>';
	}
	return out;
}

// Event to Game ID relation tooltip
function showEventGameTip(data) {
	var gidout = "<script type=\"text/javascript\">$('#event-modal-body a[title]').qtip({position: { corner: { target: 'leftMiddle', tooltip: 'rightBottom'} }, style: { name: 'light', tip: true }})</script>";
	if (data.gid == null || data.gid == -1)
		if (data.Context != null && data.Context != "(none)")
			gidout += '<a href="#" style="cursor:help" title="<center><b><u>Event to Game Information</u></b></center>This event has yet to be associated with any Game Results.  It\'s normal to see this if the event was triggered for a game that is still running.">' + data.gid+ '</a>';			
		else
			gidout += '<a href="#" style="cursor:help" title="<center><b><u>Event to Game Information</u></b></center>This event was triggered before (or after) any games were running on the server.  It\'s possible this event may never be associated with any game.">' + data.gid+ '</a>';
	else
		gidout += '<a href="#" onclick="ChangeToGameDetails('+data.gid+')" style="cursor:help" title="<center><b><u>Event to Game Information</u></b></center>This event was triggered during a game and is part of its results.  Click to view.">' + data.gid+ '</a>';
	$("#event-gid").html(gidout);
}

// Event prev/next links
function showEventPrevNext(data) {
	if (data.prev != null) {
		$("#event-Prev").fadeTo('slow',1);
		$("#event-Prev").html('<a id="'+(data.prev.eid)+'" href=# onclick="prevEvent(this.id)"><b>&lt;&lt;&nbsp;Previous</b></a>');
	} else
		$("#event-Prev").html("");
	if (data.next != null) {
		$("#event-Next").fadeTo('slow',1);
		$("#event-Next").html('<a id="'+(data.next.eid)+'" href=# onclick="nextEvent(this.id)"><b>Next&nbsp;&gt;&gt;</b></a>');
	} else
		$("#event-Next").html("");	
}

// Event modal variables with data from next/prev event
function prevEvent(eid) { $("#event-dialog a.updatemodal").trigger('click',["row"+eid,JSONData.prev,'Allegiance AGC Event Details']);}
function nextEvent(eid) { $("#event-dialog a.updatemodal").trigger('click',["row"+eid,JSONData.next,'Allegiance AGC Event Details']);}

// Called from the modal activate click handler
function EventModalRaise(e,id,title) {
	var which = WhichModal(null,"event");
	e.preventDefault();	
	$.ajax({
	   type: "POST",
	   dataType: "json",
	   url: "/AllegSkill/nph-JSONHandler.cgi?R=E&T=EventResults",
	   data: "eid="+id,
	   success: function(data){
		CacheVariables(data);
		SetDialogHeader(title,data,which); //fade
		showEventPrevNext(data);
		AllegModal.openFinish(con,data);
	   },
	   error: function(xhr,txt,e) {UhOh(xhr.responseText,"#event-dialog");}
	 });
	$("#event-modal-title span.thetitle").html("Please Wait...");
	$("#eventbutton").fadeTo("fast",0.001);
	$("#event-modal-content").modal({
		overlayId: 'alleg-overlay',
		containerId: 'alleg-container',
		closeHTML: null,
		minHeight:80,
		opacity:65, 
		position:['0',],
		overlayClose:true,
		onOpen:AllegModal.open,
		onClose:AllegModal.close
	});
}

// Called from the modal update (data) click handler
function EventModalUpdate(e,id,data,title) {
	$("#event-Prev").fadeTo('fast',0.001);
	$("#event-Next").fadeTo('fast',0.001);
	var which = WhichModal(null,"event");
	e.preventDefault();
	$.ajax({
	   type: "POST",
	   dataType: "json",
	   url: "/AllegSkill/nph-JSONHandler.cgi?R=E&T=EventResults",
	   data: "eid="+id,
	   success: function(data){
		CacheVariables(data);
		showEventPrevNext(data);
	   },
	   error: function(xhr,txt,e) {UhOh(xhr.responseText,"#event-dialog");}
	 });
	SetDialogHeader(title,data,which,true); //no fade
	AllegModal.update(con,data);	
}

////////////////////////////////////////
////////////////GAMES///////////////////
////////////////////////////////////////

var GameTypeMask = 0; //Conquest = 1, Deathmatch = 2, Flags = 4, Artifacts = 8, Prosperity = 16, Countdown = 32
var bConquest = true;
var bDeathmatch = true;
var bFlags = true;
var bArtifacts = true;
var bProsperity = true;
var bCountdown = true;

// Game modal helper used to activate it from inside the grid
function doGameDetails(id) { $("#game-dialog a.raisemodal").trigger('click',["row"+id,'Allegiance Game Result Details']); }

// Game modal helpers used to switch to views
function ChangeToEvents(id) {
	$.modal.close();
	$('ul.tabNav a.lievents').trigger('click');
	$('#flexEvents').flexOptions({qtype: 'gid', query: id}); 
}

function ChangeToTeamDetails(id) { 
	alert("+change to team id "+id); 
}

// Game Delete action - Sends D request to handler, passes param 'items'
function doGameDelete(com,grid) {
	if($('.trSelected',grid).length>0){
		if(confirm('NOTICE: Deleteing a Game result will remove all Team and Player results for that Game!\n\nAre you sure you want to delete ' + $('.trSelected',grid).length + ' games?')) {
			var items = $('.trSelected',grid);
			var itemlist ='';
			for(i=0;i<items.length;i++){
				itemlist+= items[i].id.substr(3)+",";
			}
			$.ajax({
			   type: "POST",
			   dataType: "json",
			   url: "/AllegSkill/nph-JSONHandler.cgi?R=D&T=GameResults",
			   data: "key=gid&items="+itemlist,
			   success: function(data){
				$("#flexGames").flexReload();
			   },
			   error: function(xhr,txt,e) {UhOh(xhr.responseText,"#game-dialog");}
			 });
		}
	} else
		return false;
}

// Game type filter action - Sets the mask and button image
function doGameFilter(com)
{
	if (com == "Conquest") {
		if (bConquest) {
			GameTypeMask++;
			bConquest = false;
			$('#game-dialog span.conquest').css({ 'font-weight': 'normal','background': 'url(http://build.allegiancezone.com/AllegSkill/images/conquest-off.png) no-repeat center left'});
		} else {
			GameTypeMask--;
			bConquest = true;
			$('#game-dialog span.conquest').css({ 'font-weight': 'bold','background': 'url(http://build.allegiancezone.com/AllegSkill/images/conquest.png) no-repeat center left'});
		}
	} else if (com == "Deathmatch") {
		if (bDeathmatch) {
			GameTypeMask += 2;
			bDeathmatch = false;
			$('#game-dialog span.deathmatch').css({ 'font-weight': 'normal','background': 'url(http://build.allegiancezone.com/AllegSkill/images/deathmatch-off.png) no-repeat center left'});
		} else {
			GameTypeMask -= 2;
			bDeathmatch = true;
			$('#game-dialog span.deathmatch').css({ 'font-weight': 'bold','background': 'url(http://build.allegiancezone.com/AllegSkill/images/deathmatch.png) no-repeat center left'});
		}
	} else if (com == "Flags") {
		if (bFlags) {
			GameTypeMask += 4;
			bFlags = false;
			$('#game-dialog span.flags').css({ 'font-weight': 'normal','background': 'url(http://build.allegiancezone.com/AllegSkill/images/flags-off.png) no-repeat center left'});
		} else {
			GameTypeMask -= 4;
			bFlags = true;
			$('#game-dialog span.flags').css({ 'font-weight': 'bold','background': 'url(http://build.allegiancezone.com/AllegSkill/images/flags.png) no-repeat center left'});
		}
	} else if (com == "Artifacts") {
		if (bArtifacts) {
			GameTypeMask += 8;
			bArtifacts = false;
			$('#game-dialog span.artifacts').css({ 'font-weight': 'normal','background': 'url(http://build.allegiancezone.com/AllegSkill/images/artifacts-off.png) no-repeat center left'});
		} else {
			GameTypeMask -= 8;
			bArtifacts = true;
			$('#game-dialog span.artifacts').css({ 'font-weight': 'bold','background': 'url(http://build.allegiancezone.com/AllegSkill/images/artifacts.png) no-repeat center left'});
		}
	} else if (com == "Prosperity") {
		if (bProsperity) {
			GameTypeMask += 16;
			bProsperity = false;
			$('#game-dialog span.prosperity').css({ 'font-weight': 'normal','background': 'url(http://build.allegiancezone.com/AllegSkill/images/prosperity-off.png) no-repeat center left'});
		} else {
			GameTypeMask -= 16;
			bProsperity = true;
			$('#game-dialog span.prosperity').css({ 'font-weight': 'bold','background': 'url(http://build.allegiancezone.com/AllegSkill/images/prosperity.png) no-repeat center left'});
		}		
	} else {
		if (bCountdown) {
			GameTypeMask += 32;
			bCountdown = false;
			$('#game-dialog span.countdown').css({ 'font-weight': 'normal','background': 'url(http://build.allegiancezone.com/AllegSkill/images/countdown-off.png) no-repeat center left'});
		} else {
			GameTypeMask -= 32;
			bCountdown = true;
			$('#game-dialog span.countdown').css({ 'font-weight': 'bold','background': 'url(http://build.allegiancezone.com/AllegSkill/images/countdown.png) no-repeat center left'});
		}
	}
	jQuery('#flexGames').flexOptions({newp:1, params:[{name:'GM',value:GameTypeMask}]});
	jQuery('#flexGames').flexReload();
}

// Called from the modal activate click handler
function GameModalRaise(e,id,title) {
	var which = WhichModal(null,"game");
	e.preventDefault();	
	$.ajax({
	   type: "POST",
	   dataType: "json",
	   url: "/AllegSkill/nph-JSONHandler.cgi?R=G&T=GameResults",
	   data: "gid="+id,
	   success: function(data){
	   	data.Name = data.GameDetails.szName;
	   	data.Description = '<a href="#" onclick="ChangeToEvents('+ data.GameDetails.gid+')">Click here to see all Events recorded for this game</a>';
		CacheVariables(data);
		SetDialogHeader(title,data,which); //fade
		showGamePrevNext(data);
		AllegModal.openFinish(con,data);
	   },
	   error: function(xhr,txt,e) {UhOh(xhr.responseText,"#game-dialog");}
	 });
	$("#game-modal-title span.thetitle").html("Please Wait...");
	$("#gamebutton").fadeTo("fast",0.001);
	$("#game-modal-content").modal({
		overlayId: 'alleg-overlay',
		containerId: 'alleg-container',
		closeHTML: null,
		minHeight:80,
		opacity:65, 
		position:['0',],
		overlayClose:true,
		onOpen:AllegModal.open,
		onClose:AllegModal.close
	});
}

// Called from the modal update (data) click handler (prev/next links, etc)
function GameModalUpdate(e,id,data,title) {
	var which = WhichModal(null,"game");
	$("#game-Prev").fadeTo('fast',0.001);
	$("#game-Next").fadeTo('fast',0.001);
	e.preventDefault();
	$.ajax({
	   type: "POST",
	   dataType: "json",
	   url: "/AllegSkill/nph-JSONHandler.cgi?R=G&T=GameResults",
	   data: "gid="+id,
	   success: function(data){
		CacheVariables(data);
		showGamePrevNext(data);
	   },
	   error: function(xhr,txt,e) {UhOh(xhr.responseText,"#game-dialog");}
	 });	
		data.Name = data.GameDetails.szName;
	   	data.Description = '<a href="#" onclick="ChangeToEvents('+ data.GameDetails.gid+')">Click here to see all Events recorded for this game</a>';
	SetDialogHeader(title,data,which,true); //no fade
	AllegModal.update(con,data);	
}


// Game prev/next links
function showGamePrevNext(data) {
	if (data.prev && data.prev.GameDetails != null) {
		$("#game-Prev").fadeTo('slow',1);
		$("#game-Prev").html('<a id="'+(data.prev.GameDetails.gid)+'" href=# onclick="prevGame(this.id)"><b>&lt;&lt;&nbsp;Previous</b></a>');
	} else
		$("#game-Prev").html("");
	if (data.next && data.next.GameDetails != null) {
		$("#game-Next").fadeTo('slow',1);
		$("#game-Next").html('<a id="'+(data.next.GameDetails.gid)+'" href=# onclick="nextGame(this.id)"><b>Next&nbsp;&gt;&gt;</b></a>');
	} else
		$("#game-Next").html("");	
}

// Game modal variables with data from next/prev event
function prevGame(gid) { $("#game-dialog a.updatemodal").trigger('click',["row"+gid,JSONData.prev,'Allegiance Game Result Details']);}
function nextGame(gid) { $("#game-dialog a.updatemodal").trigger('click',["row"+gid,JSONData.next,'Allegiance Game Result Details']);}

// Game divs/tables from a Params with offset and length options
function Params2Table(obj) {
	// header columns
	var out = "<script type=\"text/javascript\">$('#game-modal-body a[title]').qtip({position: { corner: { target: 'rightMiddle', tooltip: 'leftBottom'} }, style: { name: 'light', tip: true } })</script>";
	out +='<div class="rowdiv">';
	out +='<div class="celldiv_40"><span style="font-size:11px;text-decoration:underline">Value</span></div>';
	out +='<div class="celldiv_60"><span style="font-size:11px;text-decoration:underline">Parameter</span></div>';
	out +='</div>';	
	var cnt = 0;
	//Keys  - Values are output first! (Values = Keys)

	for (var i in obj) {
		cnt++;
		
		//Even / oddx
		if (cnt % 2 == 0)
			out += '<div class="rowdiv even"><div class="celldiv_40 even"><span class="smheav">';
		else
			out += '<div class="rowdiv"><div class="celldiv_40"><span class="smheav">';
		
		out += obj[i];
		if (obj[i].length == 0) 
			out += '(none)';
		out += '</span></div>';
		
		//Even / odd
		if (cnt % 2 == 0)
			out += '<div class="celldiv_60 even"><span class="smhead even" style="font-weight: bold">';
		else
			out += '<div class="celldiv_60"><span class="smhead" style="font-weight: bold">';
		// Keys are output last
		out += i;
		out += '</span></div></div>';
	}
	return out;
}


// Resizes image(s) to source w/h (expands)
function ExpandGameImages() {

	$("#gosrc").stop().animate({
			width: '584px',
			height: '433px',
			marginLeft: '-14px',
			marginTop: '-106px'
		},1000);
	$("#wcsrc").stop().animate({
			width: '196px',
			height: '433px',
			marginLeft: '-218px',
			marginTop: '-106px'
		},1000);			
}

// Resizes image(s) to source w/h (shrinks)
function ShrinkGameImages() {

	$("#gosrc").stop().animate({
			width: '173px',
			height: '128px',
			marginLeft: '65px',
			marginTop: '0px'
		},1000);
	$("#wcsrc").stop().animate({
			width: '58px',
			height: '128px',
			marginLeft: '0px',
			marginTop: '0px'
		},1000);			
}

////////////////////////////////////////
////////////////TEAMS///////////////////
////////////////////////////////////////

// Team modal helper used to activate it from inside the grid
function doTeamDetails(id) { $("#team-dialog a.raisemodal").trigger('click',["row"+id,'Allegiance Team Result Details']); }

// Team Delete action - Sends D request to handler, passes param 'items'
function doTeamDelete(com,grid) {
	if($('.trSelected',grid).length>0){
		if(confirm('Delete ' + $('.trSelected',grid).length + ' items?')) {
			var items = $('.trSelected',grid);
			var itemlist ='';
			for(i=0;i<items.length;i++){
				itemlist+= items[i].id.substr(3)+",";
			}
			$.ajax({
			   type: "POST",
			   dataType: "json",
			   url: "/AllegSkill/nph-JSONHandler.cgi?R=D&T=TeamResults",
			   data: "key=tid&items="+itemlist,
			   success: function(data){
				$("#flexTeams").flexReload();
			   },
			   error: function(xhr,txt,e) {UhOh(xhr.responseText,"#team-dialog");}
			 });
		}
	} else
		return false;
}

// Called from the modal activate click handler
function TeamModalRaise(e,id,title) {
	var which = WhichModal(null,"team");
	e.preventDefault();	
	$.ajax({
	   type: "POST",
	   dataType: "json",
	   url: "/AllegSkill/nph-JSONHandler.cgi?R=T&T=TeamResults",
	   data: "tid="+id,
	   success: function(data){
		CacheVariables(data);
		SetDialogHeader(title,data,which); //fade
		AllegModal.openFinish(con,data);
	   },
	   error: function(xhr,txt,e) {UhOh(xhr.responseText,"#team-dialog");}
	 });
	$("#team-modal-title span.thetitle").html("Please Wait...");
	$("#teambutton").fadeTo("fast",0.001);
	$("#team-modal-content").modal({
		overlayId: 'alleg-overlay',
		containerId: 'alleg-container',
		closeHTML: null,
		minHeight:80,
		opacity:65, 
		position:['0',],
		overlayClose:true,
		onOpen:AllegModal.open,
		onClose:AllegModal.close
	});
}

// Called from the modal update (data) click handler
function TeamModalUpdate(e,id,data,title) {
	var which = WhichModal(null,"team");
	e.preventDefault();
	$.ajax({
	   type: "POST",
	   dataType: "json",
	   url: "/AllegSkill/nph-JSONHandler.cgi?R=T&T=TeamResults",
	   data: "tid="+id,
	   success: function(data){
		CacheVariables(data);
		showTeamPrevNext(data);
	   },
	   error: function(xhr,txt,e) {UhOh(xhr.responseText,"#team-dialog");}
	 });	
	SetDialogHeader(title,data,which,true); //no fade
	AllegModal.update(con,data);	
}

function TeamsGameDetails(t) {
	alert('TeamsGameDetails! :' +t.id);
}

/*
// Team prev/next links
function showEventPrevNext(data) {
	if (data.prev != null) {
		$("#event-Prev").html('<a id="'+(data.eid - 1)+'" href=# onclick="prevEvent(this.id)"><b>&lt;&lt;&nbsp;Previous</b></a>');
	} else
		$("#event-Prev").html("");
	if (data.next != null) {
		$("#event-Next").html('<a id="'+(data.eid + 1)+'" href=# onclick="nextEvent(this.id)"><b>Next&nbsp;&gt;&gt;</b></a>');
	} else
		$("#event-Next").html("");	
}

// Event modal variables with data from previous event
function prevEvent(eid) { 
	if (JSONData.prev.eid == eid) {
		$("#event-dialog a.updatemodal").trigger('click',["row"+eid,JSONData.prev,'Allegiance AGC Event Details']);
	}
}

// Event modal variables with data from previous event
function nextEvent(eid) { 
	if (JSONData.next.eid == eid) 
		$("#event-dialog a.updatemodal").trigger('click',["row"+eid,JSONData.next,'Allegiance AGC Event Details']);
}
*/

////////////////////////////////////////
///////////////PLAYERS//////////////////
////////////////////////////////////////


// Player modal helper used to activate it from inside the grid
function doPlayerDetails(id) { $("#player-dialog a.raisemodal").trigger('click',["row"+id,'Allegiance Player Result Details']); }

// Player Delete action - Sends D request to handler, passes param 'items'
function doPlayerDelete(com,grid) {
	if($('.trSelected',grid).length>0){
		if(confirm('Delete ' + $('.trSelected',grid).length + ' items?')) {
			var items = $('.trSelected',grid);
			var itemlist ='';
			for(i=0;i<items.length;i++){
				itemlist+= items[i].id.substr(3)+",";
			}
			$.ajax({
			   type: "POST",
			   dataType: "json",
			   url: "/AllegSkill/nph-JSONHandler.cgi?R=D&T=PlayerResults",
			   data: "key=pid&items="+itemlist,
			   success: function(data){
				$("#flexPlayers").flexReload();
			   },
			   error: function(xhr,txt,e) {UhOh(xhr.responseText,"#player-dialog");}
			 });
		}
	} else
		return false;
}

// Called from the modal activate click handler
function PlayerModalRaise(e,id,title) {
	var which = WhichModal(null,"player");
	e.preventDefault();	
	$.ajax({
	   type: "POST",
	   dataType: "json",
	   url: "/AllegSkill/nph-JSONHandler.cgi?R=SP&T=PlayerResults",
	   data: "pid="+id,
	   success: function(data){
		CacheVariables(data);
		SetDialogHeader(title,data,which); //fade
		AllegModal.openFinish(con,data);
	   },
	   error: function(xhr,txt,e) {UhOh(xhr.responseText,"#player-dialog");}
	 });
	$("#player-modal-title span.thetitle").html("Please Wait...");
	$("#playerbutton").fadeTo("fast",0.001);
	$("#player-modal-content").modal({
		overlayId: 'alleg-overlay',
		containerId: 'alleg-container',
		closeHTML: null,
		minHeight:80,
		opacity:65, 
		position:['0',],
		overlayClose:true,
		onOpen:AllegModal.open,
		onClose:AllegModal.close
	});
}

// Called from the modal update (data) click handler
function PlayerModalUpdate(e,id,data,title) {
	var which = WhichModal(null,"player");
	e.preventDefault();
	$.ajax({
	   type: "POST",
	   dataType: "json",
	   url: "/AllegSkill/nph-JSONHandler.cgi?R=T&T=PlayerResults",
	   data: "pid="+id,
	   success: function(data){
		CacheVariables(data);
		showPlayerPrevNext(data);
	   },
	   error: function(xhr,txt,e) {UhOh(xhr.responseText,"#player-dialog");}
	 });	
	SetDialogHeader(title,data,which,true); //no fade
	AllegModal.update(con,data);	
}

/*
// Player prev/next links
function showEventPrevNext(data) {
	if (data.prev != null) {
		$("#event-Prev").html('<a id="'+(data.eid - 1)+'" href=# onclick="prevEvent(this.id)"><b>&lt;&lt;&nbsp;Previous</b></a>');
	} else
		$("#event-Prev").html("");
	if (data.next != null) {
		$("#event-Next").html('<a id="'+(data.eid + 1)+'" href=# onclick="nextEvent(this.id)"><b>Next&nbsp;&gt;&gt;</b></a>');
	} else
		$("#event-Next").html("");	
}

// Event modal variables with data from previous event
function prevEvent(eid) { 
	if (JSONData.prev.eid == eid) {
		$("#event-dialog a.updatemodal").trigger('click',["row"+eid,JSONData.prev,'Allegiance AGC Event Details']);
	}
}

// Event modal variables with data from previous event
function nextEvent(eid) { 
	if (JSONData.next.eid == eid) 
		$("#event-dialog a.updatemodal").trigger('click',["row"+eid,JSONData.next,'Allegiance AGC Event Details']);
}
*/

function filterAlpha(com) { 
	jQuery('#flexPlayers').flexOptions({newp:1, params:[{name:'SA', value: com}]});
	jQuery("#flexPlayers").flexReload(); 
}

function removeAlphaFilter(com) {
	jQuery('#flexPlayers').flexOptions({newp:1, params:[{name:'SA', value: ''}]});
	jQuery("#flexPlayers").flexReload(); 
}


// End of Allegz.js - Imago 8/10