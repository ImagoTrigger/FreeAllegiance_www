// Imago <imagotrigger@gmail.com> JQuery FlexiGrid/SimpleModal Init. & Image Preload Javascript for Allegiance Stats & AGC Events 8/10

// Start things cranking once the DOM is ready, one grid at a time starting with Events
$(document).ready(function(){

	/* Tabs */
	$('ul.tabNav a').click(function() {
		var curChildIndex = $(this).parent().prevAll().length + 1;
		$(this).parent().parent().children('.current').removeClass('current');
		$(this).parent().addClass('current');
		$('#tabcrap').children('.current').slideUp('fast',function() {
			$(this).removeClass('current');
			$(this).parent().children('div:nth-child('+curChildIndex+')').slideDown('normal',function() {
				$(this).addClass('current');
				//hack to integrate/fix grid gripz render /w tabs (hidden grids onload) 
				if (this.id == "game-dialog") {
					$('#flexGames').recalcLayout();
					$("#flexGames").flexReload();
				}
				else if (this.id == "team-dialog") {
					$('#flexTeams').recalcLayout();
					$("#flexTeams").flexReload();
				}
				else if (this.id == "player-dialog") { 
					$('#flexPlayers').recalcLayout();
					$("#flexPlayers").flexReload();
				}
				else {
					$('#flexEvents').recalcLayout();
					$("#flexEvents").flexReload();
				}
			});
		});
		return false;
	});
		
	/* Events */
	$("#flexEvents").flexigrid ({
		url: '/AllegSkill/nph-JSONHandler.cgi?R=FG&T=EventResults',
		dataType: 'json',
		sortname: "eid",
		sortorder: "desc",
		usepager: true,
		title: 'Event Results',
		useRp: true,
		rp: 25,
		showTableToggleBtn: true,
		resizable: false,
		autoload: false,
		buttons : [
			{name: 'Delete', bclass: 'delete', onpress : doEventDelete},
			{separator: true},
			{name: 'AGC', bclass: 'agc', onpress : doTypeFilter},
			{name: 'Allsrv', bclass: 'allsrv', onpress : doTypeFilter},
			{name: 'Admin', bclass: 'admin', onpress : doTypeFilter},
			{separator: true},
			{name: 'Info', bclass: 'info', onpress : doSeverityFilter},
			{name: 'Warning', bclass: 'warning', onpress : doSeverityFilter},
			{name: 'Error', bclass: 'error', onpress : doSeverityFilter}
			],
		colModel : [
			{display: 'Game ID', name : 'gid', width : 69, sortable : true, align: 'center'},
			{display: 'Event ID', name : 'Event', width : 50, sortable : true, align: 'center'},
			{display: 'Local Time', name : 'DateTime', width : 146, sortable : true, align: 'center'},
			{display: 'Computer Name', name : 'ComputerName', width : 104, sortable : true, align: 'center'},
			{display: 'Subject ID', name : 'Subject', width : 69, sortable : true, align: 'center'},
			{display: 'Subject Name', name : 'SubjectName', width : 180, sortable : true, align: 'center'},
			{display: 'Game Context', name : 'Context', width : 128, sortable : true, align: 'center'},
			{display: 'AGC', name : 'ObjectRef', width : 22, sortable : false, align: 'center',},
			{display: 'Time Entered', name : 'timeEnter', width : 128, sortable : true, align: 'center'}
			],
		searchitems : [
			{display: 'Game ID', name : 'gid', isdefault: true},
			{display: 'Context', name : 'Context'},			
			{display: 'Event ID', name : 'Event'},			
			{display: 'Subject Name', name : 'SubjectName'},
			{display: 'Computer Name', name : 'ComputerName'}
			],
		width: 1024,
		height: 542, //fits 25 rows
		onSuccess: function() {
			$("#event-dialog div.ptogtitle").qtip({position: { corner: { target: 'leftTop', tooltip: 'bottomRight'} }, style: { name: 'light', tip: true }});
			$("#flexEvents span.GridTipEvent").qtip({position: { corner: { target: 'rightMiddle', tooltip: 'leftMiddle'} }, style: { name: 'light', tip: true }});
			$("#flexEvents span.GridTipAGC").qtip({position: { corner: { target: 'leftMiddle', tooltip: 'rightMiddle'} }, style: { width: 400, name: 'light', tip: true }});
		}, 
		onError: function(xhr,txt,e) {
			UhOh(xhr.responseText,"#event-dialog");
		}
	});

	// hack to integrate flexigridz and event simplemodalz
	$("#flexEvents").click(function() {
		var rows = document.getElementById('flexEvents').getElementsByTagName('tbody')[0].getElementsByTagName('tr');
		for (i = 0; i < rows.length; i++) {
			rows[i].ondblclick = function() {
				 $("#event-dialog a.raisemodal").trigger('click',[this.id,'Allegiance AGC Event Details']);
			}
		}
	});

	/* Games */
	$("#flexGames").flexigrid ({
		url: '/AllegSkill/nph-JSONHandler.cgi?R=FG&T=GameResults',
		dataType: 'json',
		sortname: "gid",
		sortorder: "desc",
		usepager: true,
		title: 'Game Results',
		useRp: true,
		rp: 25,
		showTableToggleBtn: true,
		resizable: false,
		buttons : [
			{name: 'Delete', bclass: 'delete', onpress : doGameDelete},
			{separator: true},
			{name: 'Conquest', bclass: 'conquest', onpress : doGameFilter},
			{name: 'Deathmatch', bclass: 'deathmatch', onpress : doGameFilter},
			{name: 'Flags', bclass: 'flags', onpress : doGameFilter},
			{name: 'Artifacts', bclass: 'artifacts', onpress : doGameFilter},
			{name: 'Prosperity', bclass: 'prosperity', onpress : doGameFilter},
			{name: 'Countdown', bclass: 'countdown', onpress : doGameFilter}
		],
		colModel : [
			{display: 'Game Context', name : 'szGameID', width : 122, sortable : true, align: 'center'},
			{display: 'Name', name : 'szName', width : 182, sortable : true, align: 'center'},
			{display: 'Winning Team Name (#)', name : 'szWinningTeam', width : 166, sortable : true, align: 'center'},
			{display: 'Win Conditions (Amount)', name : 'stub', width : 282, sortable: false, align: 'center'},
			{display: 'Duration', name : 'nDuration', width : 50, sortable : true, align: 'center'},
			{display: 'Time Entered', name : 'timeEnter', width : 128, sortable : true, align: 'center'}
		],
		searchitems : [
			{display: 'Game ID', name : 'gid', isdefault: true},
			{display: 'Context', name : 'szGameID'},
			{display: 'Winning Team Name', name : 'szWinningTeam'}
			],
		width: 1024,
		height: 542,
		onSuccess: function() {
			$("#game-dialog div.ptogtitle").qtip({position: { corner: { target: 'leftTop', tooltip: 'bottomRight'} }, style: { name: 'light', tip: true }});
			$("#flexGames span.GridTipGame").qtip({position: { corner: { target: 'rightMiddle', tooltip: 'leftMiddle'} }, style: { name: 'light', tip: true }});
			$("#flexGames span.GridTipDuration").qtip({position: { corner: { target: 'leftMiddle', tooltip: 'rightMiddle'} }, style: { name: 'light', tip: true }});
		}, 
		onError: function(xhr,txt,e) {
			UhOh(xhr.responseText,"#game-dialog");
		}		
	});
	
	// hack to integrate flexigridz and game simplemodalz
	$('#flexGames').click(function() {
		var rows = document.getElementById('flexGames').getElementsByTagName('tbody')[0].getElementsByTagName('tr');
		for (i = 0; i < rows.length; i++) {
			rows[i].ondblclick = function() {
				 $("#game-dialog a.raisemodal").trigger('click',[this.id,'Allegiance Game Result Details']);
			}
		}
	 });
	
	/* Teams */
	$("#flexTeams").flexigrid ({
		url: '/AllegSkill/nph-JSONHandler.cgi?R=FG&T=TeamResults',
		dataType: 'json',
		sortname: "tid",
		sortorder: "desc",
		usepager: true,
		title: 'Team Results',
		useRp: true,
		rp: 25,
		showTableToggleBtn: true,
		autoload: false,
		resizable: false,
		buttons : [
			//{name: 'Delete', bclass: 'delete', onpress : doTeamDelete},
			//{separator: true}
		],
		colModel : [
			{display: 'Game Context', name : 'szGameID', width : 120, sortable : true, align: 'center'},
			{display: 'Name (#)', name : 'szName', width : 166, sortable : true, align: 'center'},
			{display: 'Techs', name : 'szTechs', width : 34, sortable : true, align: 'center'},
			{display: 'Civ ID', name : 'nCivID', width : 34, sortable : true, align: 'center'},
			{display: 'Kills', name : 'cPlayerKills', width : 30, sortable : true, align: 'center'},
			{display: 'Deaths', name : 'cDeaths', width : 38, sortable : true, align: 'center'},
			{display: 'Ejects', name : 'cEjections', width : 34, sortable : true, align: 'center'},			
			{display: 'Destroys', name : 'cBaseKills', width : 46, sortable : true, align: 'center'},
			{display: 'Captures', name : 'cBaseCaptures', width : 46, sortable : true, align: 'center'},
			{display: 'Goals Attempted (Amount)', name : 'stub', width : 278, sortable : false, align: 'center'},
			{display: 'Endured', name : 'nTimeEndured', width : 46, sortable : true, align: 'center'}
			
		],
		searchitems : [
			{display: 'Game ID', name : 'gid', isdefault: true},
			{display: 'Team ID', name : 'tid'},
			{display: 'Context', name : 'szGameID'},
			{display: 'Team Name', name : 'szName'},
			{display: 'Civ ID', name : 'nCivID'}
			],		
		width: 1024,
		height: 542,
		onSuccess: function() {
			$("#team-dialog div.ptogtitle").qtip({position: { corner: { target: 'leftTop', tooltip: 'bottomRight'} }, style: { name: 'light', tip: true }});
			$("#flexTeams span.GridTipGame").qtip({position: { corner: { target: 'rightMiddle', tooltip: 'leftMiddle'} }, style: { name: 'light', tip: true }});
			$("#flexTeams span.GridTipTechs").qtip({position: { corner: { target: 'rightMiddle', tooltip: 'leftMiddle'} }, style: { name: 'light', tip: true }});
			$("#flexTeams span.GridTipDuration").qtip({position: { corner: { target: 'leftMiddle', tooltip: 'rightMiddle'} }, style: { name: 'light', tip: true }});
		}, 
		onError: function(xhr,txt,e) {
			UhOh(xhr.responseText,"#team-dialog");
		}
	});

	// hack to integrate flexigridz and game simplemodalz
	$('#flexTeams').click(function() {
		var rows = document.getElementById('flexTeams').getElementsByTagName('tbody')[0].getElementsByTagName('tr');
		for (i = 0; i < rows.length; i++) {
			rows[i].ondblclick = function() {
				 $("#team-dialog a.raisemodal").trigger('click',[this.id,'Allegiance Team Result Details']);
			}
		}
	 });

	/* Players */
	$("#flexPlayers").flexigrid ({
		url: '/AllegSkill/nph-JSONHandler.cgi?R=FG&T=PlayerResults',
		dataType: 'json',
		sortname: "pid",
		sortorder: "desc",
		usepager: true,
		title: 'Player Results',
		useRp: true,
		rp: 25,
		showTableToggleBtn: true,
		autoload: false,
		resizable: false,
		buttons : [
			//{name: 'Delete', bclass: 'delete', onpress : doPlayerDelete},
			//{separator: true},
			{name: 'A', onpress: filterAlpha},
			{name: 'B', onpress: filterAlpha},
			{name: 'C', onpress: filterAlpha},
			{name: 'D', onpress: filterAlpha},
			{name: 'E', onpress: filterAlpha},
			{name: 'F', onpress: filterAlpha},
			{name: 'G', onpress: filterAlpha},
			{name: 'H', onpress: filterAlpha},
			{name: 'I', onpress: filterAlpha},
			{name: 'J', onpress: filterAlpha},
			{name: 'K', onpress: filterAlpha},
			{name: 'L', onpress: filterAlpha},
			{name: 'M', onpress: filterAlpha},
			{name: 'N', onpress: filterAlpha},
			{name: 'O', onpress: filterAlpha},
			{name: 'P', onpress: filterAlpha},
			{name: 'Q', onpress: filterAlpha},
			{name: 'R', onpress: filterAlpha},
			{name: 'S', onpress: filterAlpha},
			{name: 'T', onpress: filterAlpha},
			{name: 'U', onpress: filterAlpha},
			{name: 'V', onpress: filterAlpha},
			{name: 'W', onpress: filterAlpha},
			{name: 'X', onpress: filterAlpha},
			{name: 'Y', onpress: filterAlpha},
			{name: 'Z', onpress: filterAlpha},
			{name: '#', onpress: filterAlpha},
			{separator: true},
			{name: 'Show All', onpress: removeAlphaFilter}
		],
		colModel : [
			{display: 'Char ID', name : 'CharacterID', width : 69, sortable : true, align: 'center'},
			{display: 'Game Context', name : 'szGameID', width : 120, sortable : true, align: 'center'},
			{display: 'Name (Team #)', name : 'szName', width : 182, sortable : true, align: 'center'},
			{display: 'Kills', name : 'cPlayerKills', width : 24, sortable : false, align: 'center'},
			{display: 'Deaths', name : 'cDeaths', width : 38, sortable : true, align: 'center'},
			{display: 'Ejects', name : 'cEjections', width : 30, sortable : true, align: 'center'},			
			{display: 'Destroys', name : 'cPilotBaseKills', width : 46, sortable : true, align: 'center'},
			{display: 'Captures', name : 'cPilotBaseCaptures', width : 48, sortable : true, align: 'center'},
			{display: 'Rescues', name : 'cRescues', width : 46, sortable : true, align: 'center'},
			{display: 'Techs', name : 'cTechsRecovered', width : 46, sortable : true, align: 'center'},
			{display: 'Score', name : 'fScore', width : 46, sortable : true, align: 'center'},
			{display: 'Rating', name : 'fCombatRating', width : 48, sortable : true, align: 'center'},
			{display: 'Duration', name : 'nTimePlayed', width : 46, sortable : true, align: 'center'},
			{display: 'Cmd', name : 'nTimeCmd', width : 46, sortable : true, align: 'center'}
		],
		searchitems : [
			{display: 'Game ID', name : 'gid', isdefault: true},
			{display: 'Player ID', name : 'pid'},
			{display: 'Team ID', name : 'tid'},
			{display: 'Context', name : 'szGameID'},
			{display: 'Player Name', name : 'szName'},
			{display: 'Charecter ID', name : 'CharacterID'}
			],		
		width: 1024,
		height: 542,
		onSuccess: function() {
			$("#player-dialog div.ptogtitle").qtip({position: { corner: { target: 'leftTop', tooltip: 'bottomRight'} }, style: { name: 'light', tip: true }});
			$("#flexPlayers span.GridTipGame").qtip({position: { corner: { target: 'rightMiddle', tooltip: 'leftMiddle'} }, style: { name: 'light', tip: true }});
			$("#flexPlayers span.GridTipDuration").qtip({position: { corner: { target: 'leftMiddle', tooltip: 'rightMiddle'} }, style: { name: 'light', tip: true }});
		}, 
		onError: function(xhr,txt,e) {
			UhOh(xhr.responseText,"#player-dialog");
		}
	});

	// hack to integrate flexigridz and game simplemodalz
	$('#flexPlayers').click(function() {
		var rows = document.getElementById('flexPlayers').getElementsByTagName('tbody')[0].getElementsByTagName('tr');
		for (i = 0; i < rows.length; i++) {
			rows[i].ondblclick = function() {
				 $("#player-dialog a.raisemodal").trigger('click',[this.id,'Allegiance Player Result Details']);
			}
		}
	 });	 
});

// End of Loadz.js - Imago 9/10