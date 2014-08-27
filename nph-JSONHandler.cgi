# Imago <imagotrigger@gmail.com>
# SQL to JSON For Allegiance Games and Events
#  Uses as few sprinkles of HTML as possible (only <br/>, Jquery stuff and fatalsToBrowser)

################################################################
## Requires AGC.dll to be registered on the host web-server! ###
################################################################

################################################################
# Uses Text Core subdirs,  AGCEvents.xml and AGCIDL.h in $dir! #
################################################################


use strict;
use CGI qw(:standard -nph);
use CGI::Carp qw(fatalsToBrowser); 
use DBI;
use DateTime::Format::SQLite;
use XML::Hash;
use JSON;
use enum qw( 
	BITMASK:EM_ AGC ALLSRV ADMIN
	BITMASK:SM_ INFO WARNING ERROR
	BITMASK:GM_ CONQUEST DEATHMATCH FLAGS ARTIFACTS PROSPERITY COUNTDOWN
); #Thanks again TRZ, enum is great!
use Text::Wrap;
use IPC::Open2;
use POSIX qw(floor ceil);
use MIME::Base64;
use Convert::Binary::C::Cached;

#
use Data::Dumper;
my $TEST = 1; #woot
my $dir = "C:/Inetpub/wwwroot/build/AllegSkill";
#my $dir = ".";

#setup the response handlers
$| = 1;
my $query = new CGI; 
our %Vars = $query->Vars;
if ($ENV{'QUERY_STRING'} =~ /^R=(.+)&T=(.+)/) { #for JQuery
	$Vars{'R'} = $1;
	$Vars{'T'} = $2;
}
if ($query->user_agent() ne 'AllegianceZone.com Leaderboard' && $TEST != 1) {
	print $query->header;
	print "OK";
	exit 0;
}
our %Rs = {}; our %tz = {}; our %dispatch = {};
print $query->header('application/json');

#setup the databases
my $dbefile = "$dir/events.db";
my $dbsfile = "$dir/stats.db";

#events
our $dbeh 	= DBI->connect("dbi:SQLite:dbname=$dbefile","","") or die $!;
our $seledt 	= $dbeh->prepare(q{SELECT DATETIME('NOW')}) or die $!;
our $sele 	= $dbeh->prepare(q{SELECT * FROM EventResults WHERE timeEnter <= ? AND timeEnter >= ?}) or die $!;
our $selenew 	= $dbeh->prepare(q{SELECT * FROM EventResults WHERE eid >= ?}) or die $!;
our $seled 	= $dbeh->prepare(q{SELECT * FROM EventResults WHERE eid = ?}) or die $!;
our $seled_next = $dbeh->prepare(q{SELECT * FROM EventResults WHERE eid > ? ORDER BY eid ASC LIMIT 0,1}) or die $!;
our $seled_prev = $dbeh->prepare(q{SELECT * FROM EventResults WHERE eid < ? ORDER BY eid DESC LIMIT 0,1}) or die $!;

#stats
our $dbsh 	 = DBI->connect("dbi:SQLite:dbname=$dbsfile","","") or die $!;
our $sels 	 = $dbsh->prepare(q{SELECT * FROM GameResults WHERE timeEnter <= ? AND timeEnter >= ?}) or die $!;	
our $selsgd 	 = $dbsh->prepare(q{SELECT * FROM GameResults LEFT JOIN MissionParams ON MissionParams.gid = GameResults.gid WHERE GameResults.gid = ?}) or die $!; # 1<-1
our $selsgd_next = $dbsh->prepare(q{SELECT * FROM GameResults LEFT JOIN MissionParams ON MissionParams.gid = GameResults.gid WHERE GameResults.gid > ? ORDER BY gid ASC LIMIT 0,1}) or die $!; # 1<-1
our $selsgd_prev = $dbsh->prepare(q{SELECT * FROM GameResults LEFT JOIN MissionParams ON MissionParams.gid = GameResults.gid WHERE GameResults.gid < ? ORDER BY gid DESC LIMIT 0,1}) or die $!; # 1<-1
our $selstd 	 = $dbsh->prepare(q{SELECT * FROM TeamResults WHERE tid = ?}) or die $!;	
our $selstd_next = $dbsh->prepare(q{SELECT * FROM TeamResults WHERE tid > ? ORDER BY tid desc LIMIT 0,1}) or die $!;	
our $selstd_prev = $dbsh->prepare(q{SELECT * FROM TeamResults WHERE tid < ? ORDER BY tid DESC LIMIT 0,1}) or die $!;	
our $selspd 	 = $dbsh->prepare(q{SELECT * FROM PlayerResults WHERE pid = ?}) or die $!;	
our $selspd_next = $dbsh->prepare(q{SELECT * FROM PlayerResults WHERE pid > ? ORDER BY pid desc LIMIT 0,1}) or die $!;
our $selspd_prev = $dbsh->prepare(q{SELECT * FROM PlayerResults WHERE pid < ? ORDER BY pid DESC LIMIT 0,1}) or die $!;
	
#obtain 'now' from the database
$seledt->execute() or die $!;
our $now;
$seledt->bind_columns(\$now) or die $!;
$seledt->fetch;
die $! if (!$now);

#parse and cache the AGCEvents.xml, only need to do this if you need a new AGCEvents.json
#so comment it out to save a file op
#SaveParsedEvents();

#look for activity in the last x minutes
our $dtnow = DateTime::Format::SQLite->parse_datetime($now);
my $dtbehind = $dtnow->clone();
$dtbehind = $dtbehind->subtract(minutes => ($Vars{'later'}) ? $Vars{'later'} : 5);
our $later = DateTime::Format::SQLite->format_datetime($dtbehind);

#process the response
&Init();
my $response = $Vars{'R'} || 'I';
my $out = ($Rs{$response}) ? $Rs{$response}->() : $Rs{E}->();	
print $out;

#tada
$selspd_prev->finish;
$selstd_prev->finish;
$selsgd_prev->finish;
$selspd_next->finish;
$selstd_next->finish;
$selsgd_next->finish;
$seled_prev->finish;
$seled_next->finish;
$selsgd->finish;
$selstd->finish;
$selspd->finish;
$seled->finish;
$sels->finish;
$sele->finish;
$seledt->finish;
$selenew->finish;
$dbeh->disconnect;
$dbsh->disconnect;
exit 0; # as in, OK DONE!



#### Response Subroutines
###
##

sub PlayersTeamDetails 	{return 'NYI';}
sub PlayersGameDetails 	{return 'NYI';}
sub TeamsGameDetails 	{return 'NYI';}

# The default response
sub Index {	
	#grab up the recent events
	$sele->execute($now,$later) or die $!;
	my @events = ();
	while (my $h = $sele->fetchrow_hashref) {push(@events,$h);}

	#grab up the recent games
	$sels->execute($now,$later) or die $!;
	my @games = ();
	while (my $h = $sels->fetchrow_hashref) {push(@games,$h);}
	my @response = (@events, @games);
	
	return encode_json \@response;
}

# Return a PlayerResult from 'pid' TODO and it's immediate surrounding players
sub PlayerDetails {
	my $prow = $Vars{'pid'};
	if ($prow =~ /row(\d+)/) {	
		my $id = $1;
		#cur
		$selspd->execute($1) or die $!;
		my $h = $selspd->fetchrow_hashref;
#TODO		#$h = CreatePlayerImageURL($h);		
		my %json = (PlayerDetails => $h);
		#next		
		$selspd_next->execute($1);
		$h = $selspd_next->fetchrow_hashref;
#TODO		#$h = CreatePlayerImageURL($h);			
		$json{next}{PlayerDetails} = $h if ($h->{tid});
		#prev
		$selspd_prev->execute($1);
		$h = $selspd_next->fetchrow_hashref;
#TODO		#$h = CreatePlayerImageURL($h);				
		$json{prev}{PlayerDetails} = $h if ($h->{tid});
		
		return encode_json \%json;
	} else {
		die "Error: No row specified $!";
	}
}

# Return a TeamResult from 'tid' TODO and it's immediate surrounding teams
sub TeamDetails {
	my $trow = $Vars{'tid'};
	if ($trow =~ /row(\d+)/) {	
		my $id = $1;
		#cur
		$selstd->execute($1) or die $!;
		my $h = $selstd->fetchrow_hashref;
#TODO		#$h = FormatFactionResearchResult($h);		
		my %json = (TeamDetails => $h);
		#next		
		$selstd_next->execute($1);
		$h = $selstd_next->fetchrow_hashref;
#TODO		#$h = FormatFactionResearchResult($h);				
		$json{next}{TeamDetails} = $h if ($h->{tid});
		#prev
		$selstd_prev->execute($1);
		$h = $selstd_next->fetchrow_hashref;
#TODO		#$h = FormatFactionResearchResult($h);				
		$json{prev}{TeamDetails} = $h if ($h->{tid});
		
		return encode_json \%json;
	} else {
		die "Error: No row specified $!";
	}
}

# Return a MissionParam & GameResult from 'gid' and it's immediate surrounding games
sub GameDetails {
	my $grow = $Vars{'gid'};
	if ($grow =~ /row(\d+)/) {
		my $id = $1;
		#cur
		$selsgd->execute($id) or die $!;
		my $h = $selsgd->fetchrow_hashref;
		my $jp = FormatMissionParams($h->{JSON});
		delete $h->{JSON};
		$Text::Wrap::columns = 22;
		$h->{szName} = wrap('', '<br/>',$h->{szName}); 
		$h->{nDuration} = sprintf("%02d:%02d:%02d",(gmtime($h->{nDuration}))[2,1,0]);
		$h->{szWinningTeam} = "(none)" if (!$h->{szWinningTeam});
		my %json = (GameDetails => $h, Params => $jp);
		#next
		$selsgd_next->execute($id) or die $!;
		$h = $selsgd_next->fetchrow_hashref;
		$jp = undef;
		$jp = FormatMissionParams($h->{JSON});
		$json{next}{Params} = $jp if ($jp);
		delete $h->{JSON};
		$h->{szName} = wrap('', '<br/>',$h->{szName}); 		
		$h->{nDuration} = sprintf("%02d:%02d:%02d",(gmtime($h->{nDuration}))[2,1,0]);
		$h->{szWinningTeam} = "(none)" if (!$h->{szWinningTeam});
		$json{next}{GameDetails} = $h if ($h->{timeEnter});
		#prev
		$selsgd_prev->execute($id) or die $!;
		$h = $selsgd_prev->fetchrow_hashref;
		$jp = undef;
		$jp = FormatMissionParams($h->{JSON});
		$json{prev}{Params} = $jp if ($jp);
		delete $h->{JSON};
		$h->{szName} = wrap('', '<br/>',$h->{szName}); 		
		$h->{nDuration} = sprintf("%02d:%02d:%02d",(gmtime($h->{nDuration}))[2,1,0]);
		$h->{szWinningTeam} = "(none)" if (!$h->{szWinningTeam});
		$json{prev}{GameDetails} = $h if ($h->{timeEnter});
		
		return encode_json \%json;
	} else {
		die "Error: No row specified $!";
	}
}

# Return an EventResult from 'eid' and it's immediate surrounding events
sub EventDetails {
	my $erow = $Vars{'eid'};
	if ($erow =~ /row(\d+)/) {		
		#cur
		$seled->execute($1) or die $!;
		my $h = $seled->fetchrow_hashref;
		my $details = FormatAGCEventResult(GetAGCEventDetails($h->{Event}),$h);
		#next		
		$seled_next->execute($1);
		$h = $seled_next->fetchrow_hashref;
		$details->{next} = FormatAGCEventResult(GetAGCEventDetails($h->{Event}),$h) if ($h);
		#prev
		$seled_prev->execute($1);
		$h = $seled_prev->fetchrow_hashref;
		$details->{prev} = FormatAGCEventResult(GetAGCEventDetails($h->{Event}),$h) if ($h);
		
		return encode_json $details;
	} else {
		die "Error: No row specified $!";
	}
}

### RESTRICTED METHODS
##

# This should be restricted NYI - "FlexiGrid" via JQuery
sub FlexiGrid {
	# filters & pagination
	my $page = $Vars{'page'} || 1;
	my $rp = $Vars{'rp'} || 25;
	my $sortname = $Vars{'sortname'} || 'eid';
	my $sortorder = $Vars{'sortorder'} || 'desc';
	my $start = ($page - 1) * $rp;
	$Vars{'qtype'} = split(/\W/,$Vars{'qtype'});
	my $where = ($Vars{'qtype'} =~ /id$/i) 
		? ($Vars{'query'}) ? 'WHERE '.$Vars{'qtype'}." = ".$Vars{'query'} : ''
		: ($Vars{'query'}) ? 'WHERE '.$Vars{'qtype'}." LIKE '%".$Vars{'query'}."%'" : '';
		
	my $table = $Vars{'T'} || 'GameResults';
	
	# bitmasks
	my $em = ($Vars{'EM'} =~ /\d+/) ? $Vars{'EM'} : 7;
	my $sm = ($Vars{'SM'} =~ /\d+/) ? $Vars{'SM'} : 7;
	my $gm = ($Vars{'GM'} =~ /\d+/) ? $Vars{'GM'} : 0;
	#my $wlm = ($Vars{'WLM'} =~ /\d+/) ? $Vars{'WLM'} : 0;
	
	my $sa = ($Vars{'SA'}) ? $Vars{'SA'} : '';
	
	# build the query & exec on the appropriate DB handle
	my $dbh;
	if ($table eq 'EventResults') {
		$where .= ($em < 7 || $sm < 7) ? eventfilterSQL($em,$sm,$where) :'';
		$dbh = $dbeh;
	} elsif ($table eq 'GameResults') {
		$where .= ($gm > 0) ? gamefilterSQL($gm,$where) :'';
		$dbh = $dbsh;
	} elsif ($table eq 'TeamResults') {
		#$where .= ($tm > 0) ? techfilterSQL($tm,$wlm,$where) :'';
		$dbh = $dbsh;
	} elsif ($table eq 'PlayerResults') {
		$where .= ($sa ne '') ? alphafilterSQL($sa,$where) :'';
		$dbh = $dbsh;
	} else {
		die "Error: No valid table specified $!";
	}
	
	my $selfg = $dbh->prepare(qq{SELECT * FROM $table $where ORDER BY $sortname $sortorder LIMIT ?, ?}) or die $!;
	$selfg->execute($start,$rp) or die "$! <p> Table: $table <br/> Where: $where <br/> Sort: $sortname $sortorder </p>";
	
	#build the structured data necessary for the grid
	my @rows = ();
	while (my @cells = $selfg->fetchrow_array) {
		my %col = ();
		$col{id} = $cells[0];
		my $id = $col{id};
		
		#EVENT (2 special columns)
		if ($table eq 'EventResults') {
			# presentation for object reference (/w an encoded objref title)
			my $objref = substr($cells[8],0,4);
			$Text::Wrap::columns = 60;
			my $wrap_ref = wrap('<br/>', '<br/>',$cells[8]); 
			$wrap_ref=~ s/\'|\"//gi;
			my $msg = qq{<center><b><u>Encoded AGC Object Reference</u></b>$wrap_ref<hr size=1 width=75%>Click to see the event details which contain the decoded object.</center>}; #'
			$objref = qq{<span title="$msg" class="GridTipAGC" style="text-decoration: underline; cursor:help" onclick="doEventDetails($id)">$objref</span>};
			$cells[8] = $objref;
			
			# also now event id /w a EventName title
			my $e = GetAGCEventDetails($cells[2]);
			$msg = qq{<center><b><u>Event Name</u></b><br/>$e->{Name}</center>};
			$cells[2] = qq{<span title="$msg" class="GridTipEvent"  style="text-decoration: underline; cursor:help" onclick="doEventDetails($id)">$cells[2]</span>};
			
			#remove unused id
			splice @cells,0,1;
		}
		
		#GAME (4 special columns)
		if ($table eq 'GameResults') {
			#add context title /w GameID
			my $msg = qq{<center><b><u>Game ID</u></b><br/>$id</center>};
			$cells[1] = qq{<span title="$msg" class="GridTipGame" style="text-decoration: underline; cursor:help" onclick="doGameDetails($id)">$cells[1]</span>};
			#flatten goals into one cell
			my $string = "";
			my $bco = $cells[5];  my $aco = $cells[11]; 
			my $bcd = $cells[6];  my $acd = $cells[12];
			my $bdm = $cells[7];  my $adm = $cells[13];
			my $bpr = $cells[8];  my $apr = $cells[14];
			my $bar = $cells[9];  my $aar = $cells[15];
			my $bfl = $cells[10]; my $afl = $cells[16];
			$string .= "Conquest ($aco%) " if ($bco);
			$string .= "Timer ($acd Min) " if ($bcd);
			$string .= "DM ($adm Kills) " if ($bdm);
			$string .= "Prosperity (\$$apr) " if ($bpr);
			$string .= "Artifacts ($aar) " if ($bar);
			$string .= "Flags ($afl)" if ($bfl);
			$cells[5] = $string; 
			splice @cells,6,11;
			
			# time in minutes (as float), /w a HH:MM:SS title
			my $hms = sprintf("%02d:%02d:%02d",(gmtime($cells[6]))[2,1,0]);
			$msg = qq{<center><b><u>HH:MM:SS</u></b><br/>$hms</center>};
			my $mins = sprintf("%.2f",$cells[6] / 60);
			$cells[6] = qq{<span title="$msg" class="GridTipDuration" style="text-decoration: underline; cursor:help" onclick="doGameDetails($id)">$mins</span>};
			
			# flatten team name with id into one cell
			$cells[3] = $cells[3] . ' ('.$cells[4].')' if ($cells[4] != -1);
			splice @cells,4,1;
			
			#remove unused id
			splice @cells,0,1;			
		}
		
		# TEAM (5 special columns)
		if ($table eq 'TeamResults') {
			#add context title /w GameID
			my $msg = qq{<center><b><u>Game ID</u></b><br/>$cells[1]</center>};
			$cells[2] = qq{<span title="$msg" class="GridTipGame" style="text-decoration: underline; cursor:help" onclick="doTeamDetails($id)">$cells[2]</span>};
			
			# flatten team name with id into one cell
			$cells[3] = $cells[4] . ' ('.$cells[3].')' if ($cells[3] != -1);
			splice @cells,4,1;
			
			#flatten goals into one cell
			my $string = "";			
			my $afl = $cells[11];
			my $aar = $cells[12];
			my $aco = $cells[13];
			my $aprb = $cells[14];
			my $aprc = $cells[15];			
			$string .= "Conquest ($aco%) " if ($aco);
			$string .= "Flags ($afl)" if ($afl);			
			$string .= "Artifacts ($aar) " if ($aar);			
			$string .= "Prosperity (\$$aprb / \$$aprc) " if ($aprb);
			$cells[11] = $string; 
			splice @cells,12,4;
			
			# time in minutes (as float), /w a HH:MM:SS title
			my $hms = sprintf("%02d:%02d:%02d",(gmtime($cells[12]))[2,1,0]);
			$msg = qq{<center><b><u>HH:MM:SS</u></b><br/>$hms</center>};
			my $mins = sprintf("%.2f",$cells[12] / 60);
			$cells[12] = qq{<span title="$msg" class="GridTipDuration" style="text-decoration: underline; cursor:help" onclick="doTeamDetails($id)">$mins</span>};			
			
			# presentation for "bitmask string" (/w an explination title)
			my $mask = substr($cells[4],0,5);
			$Text::Wrap::columns = 31;
			my $wrap_ref = wrap('<br/>', '<br/>',$cells[4]); $wrap_ref=~ s/\'|\"//gi;
			my $msg = qq{<center><b><u>Tech-Tree Bitmask String</u></b>$wrap_ref<hr size=1 width=75%>Click to see the team details which contain the researched techs.</center>}; #'
			$mask = qq{<span title="$msg" class="GridTipTechs" style="text-decoration: underline; cursor:help" onclick="doTeamDetails($id)">$mask</span>};
			$cells[4] = $mask;
			
			#remove unused id
			splice @cells,0,2;
		}
		
		#PLAYERS (2 special columns and reordering)
		if ($table eq 'PlayerResults') {	
			
			# flatten team name with id into one cell
			$cells[4] = $cells[4] . ' ('.$cells[3].')' if ($cells[3] != -1);
						
			#add context title /w GameID
			my $msg = qq{<center><b><u>Game ID</u></b><br/>$cells[1]</center>};
			$cells[3] = qq{<span title="$msg" class="GridTipGame" style="text-decoration: underline; cursor:help" onclick="doPlayerDetails($id)">$cells[2]</span>};

			#move charID to the front
			$cells[2] = $cells[29];
			
			# total kills (only here)
			$cells[5] = $cells[5] + $cells[6] + $cells[7] + $cells[8];
			
			# shift (skip assits/spotted stuff)
			$cells[6] = $cells[13];
			$cells[7] = $cells[14];
			$cells[8] = $cells[11];
			$cells[9] = $cells[12];
			$cells[10] = $cells[15];
			$cells[11] = $cells[18];
			$cells[12] = sprintf("%.2f",$cells[22]);
			$cells[13] = sprintf("%.2f",$cells[21]);
			$cells[14] = $cells[23];
			$cells[15] = $cells[24];
			
			#toss the rest
			splice @cells, 16,14;
			
			# time in minutes (as float), /w a HH:MM:SS title
			my $hms = sprintf("%02d:%02d:%02d",(gmtime($cells[14]))[2,1,0]);
			$msg = qq{<center><b><u>HH:MM:SS</u></b><br/>$hms</center>};
			my $mins = sprintf("%.2f",$cells[14] / 60);
			$cells[14] = qq{<span title="$msg" class="GridTipDuration" style="text-decoration: underline; cursor:help" onclick="doPlayerDetails($id)">$mins</span>};						
			
			# cmd time in minutes (as float), /w a HH:MM:SS title (we can reuse the same Tip class)
			$hms = sprintf("%02d:%02d:%02d",(gmtime($cells[15]))[2,1,0]);
			$msg = qq{<center><b><u>HH:MM:SS</u></b><br/>$hms</center>};
			$mins = sprintf("%.2f",$cells[15] / 60);
			$cells[15] = qq{<span title="$msg" class="GridTipDuration" style="text-decoration: underline; cursor:help" onclick="doPlayerDetails($id)">$mins</span>};						
			
			#remove unused id
			splice @cells,0,2;			
		}
		
		# add the cells to the column and push it onto the row
		@{$col{cell}} = @cells;
		push(@rows,\%col);		
	}
	$selfg->finish;
	
	# gather filtered totals for pagination
	my $selc = $dbh->prepare(qq{SELECT COUNT(*) FROM $table $where}) or die $!;
	$selc->execute();
	my $total;
	$selc->bind_columns(\$total);
	$selc->fetch;
	$selc->finish;
	
	# slap it together
	my %json = (total => $total, page => $page);
	$json{rows} = \@rows;
	
	return encode_json \%json;
}

# This should be restricted - Administrative

##
### END RESTRICTED METHODS


### Subroutines that are not Handler access methods (internal functions)
##

sub Init {
	# ObjRef2String compatible AGC interfaces - see AGCIDL
	%dispatch  = (	
  		"{EFC30B36-13B1-11D3-8B5E-00C04F681633}" => { #Used in Event 302
  			IID 	=> "IAGCVector",
  			Desc	=> "Interface to an AGC Vector object.<br/>Initialized from an Object Reference."
  		},
		"{C6D92776-3998-11D3-A51D-00C04F68DEB0}" => { #NYI (unused)
			IID 	=> "IAGCOrientation",
		},
		"{7CDC82F6-FE9D-11D2-A50F-00C04F68DEB0}" => { #NYI (unused)
			IID	=> "IAGCCommand",
		},
		"{E71EA5B9-EBA4-11D2-8B4B-00C04F681633}" => { #NYI (unused)
			IID	=> "IAGCGameParameters",
		},
		#...NYI (this opens up a world of data relativly painless!)
	);

  	### ONLY timezones where you are WANT to track Events from ###
  	# The less there are the more accurate the validation is, currently it's great!
	%tz = (
#		-12	=>	' ',
#		-11	=>	'Samoa Standard Time',
#		-10	=>	'Hawaii-Aleutian Standard Time',
#		-9	=>	'HADT/Alaska Standard Time',
#		-8	=>	'AKDT/Pacific Standard Time',
#		-7	=>	'PDT/Mountain Standard Time',
		-6	=>	'MDT/Central&nbsp;Standard&nbsp;Time',
		-5	=>	'CDT/Eastern&nbsp;Standard&nbsp;Time',
#		-4	=>	'ECT/EDT/Atlantic Standard Time',
#		-3	=>	'Atlantic Daylight Time',
#		-2	=>	' ',
#		-1	=>	' ',
#		0 	=>	'Coordinated Universal Time',
		1 	=>	'Central&nbsp;European&nbsp;Time',
		2 	=>	'CEST/Central&nbsp;Africa&nbsp;Time',
#		3 	=>	'East Africa Time',
#		4 	=>	'Gulf Standard Time',
#		5 	=>	'Yekaterinburg Time',
#		6 	=>	'Omsk Time',
#		7 	=>	'Krasnoyarsk Time',
#		8 	=>	'China Standard Time',
#		9	=>	'Japan Standard Time',
		10	=>	'AEST/Chamorro&nbsp;Standard&nbsp;Time',
		11	=>	'Australian Eastern&nbsp;Daylight&nbsp;Time',
#		12	=>	' ',
#		13	=>	' ',
#		14	=>	' '
	);

	%Rs = (
		# the list of cmd/responses 		#params (R req.)
		I	=> \&Index, 			#later (minutes)
		W 	=> \&DoIdle,			#eid (optional)
		P	=> \&Pump,			#eid (required)
		T	=> \&TeamDetails,		#tid
		GT	=> \&TeamsGameDetails,		#gid
		SP 	=> \&PlayerDetails,		#pid
		TP 	=> \&PlayersTeamDetails,	#tid
		GP 	=> \&PlayersGameDetails,	#gid
		G 	=> \&GameDetails,		#gid
		E	=> \&EventDetails,		#eid
		FG	=> \&FlexiGrid,			#page rp (results/page) sortname sortorder filtermask (EM, SM, GM, SA - single bit, not mask)
		D	=> \&Delete,			#T (table) id
	);
}

#  Parses the AGCEvents.xml for type, bounds, severity etc then saves it
sub SaveParsedEvents {
	my %events = ();
	if (!-e "$dir/AGCEvents.json") {
		open FILE, "<$dir/AGCEvents.xml" or die "Couldn't read $dir/AGCEvents.xml $!";
		my $xml = do { local $/; <FILE> };
		close FILE;
		my $xml_converter = XML::Hash->new();
		my $xml_hash = $xml_converter->fromXMLStringtoHash($xml);
		my $topel = $xml_hash->{AGCEvents};
		foreach my $group (@{$topel->{EventGroup}}) {
			 if ($group->{Name} =~ /agc/i) {
				$events{AGC}{L} = $group->{LowerBound};
				$events{AGC}{H} = $group->{UpperBound};
				foreach my $event (@{$group->{EventGroup}}) {
					push(@{$events{AGC}{E}},@{$event->{Event}});
				}
			 }
			 if ($group->{Name} =~ /allsrv/i) {
				$events{Allsrv}{L} = $group->{LowerBound};
				$events{Allsrv}{H} = $group->{UpperBound};
				push(@{$events{Allsrv}{E}},@{$group->{Event}});
			 }
			 if ($group->{Name} =~ /admin/i) {
				$events{Admin}{L} = $group->{LowerBound};
				$events{Admin}{H} = $group->{UpperBound};
				push(@{$events{Admin}{E}},@{$group->{Event}});
			 }			 
		}
		open FILE, ">$dir/AGCEvents.json" or die "Couldn't write $dir/AGCEvents.json $!";
		print FILE encode_json \%events;
		close FILE;
	}
}

# Creates WHERE (and AND) SQL clauses based on TypeMask and SeverityMask
sub eventfilterSQL {
	my ($em,$sm,$where) = @_;
	my $sql = ($where) ? ' AND Event IN (' : 'WHERE Event IN (';
	
	
	open FILE, "$dir/AGCEvents.json" or die "Couldn't read $dir/AGCEvents.json $!";
	my $json = do { local $/; <FILE> };
	close FILE;
	$json = decode_json $json;
	my %events = %$json;
	
	#types we can use & severities we can/cant see
	my %ids = ();
	if ($em & EM_AGC) {
		foreach my $e (@{$events{AGC}{E}}) {
			$ids{$e->{id}} = 1;
			if ($e->{Severity} =~ /info/i) {
				$ids{$e->{id}} = ($sm & SM_INFO);
			}
			if ($e->{Severity} =~ /warning/i) {
				$ids{$e->{id}} = ($sm & SM_WARNING);
			}
			if ($e->{Severity} =~ /error/i) {
				$ids{$e->{id}} = ($sm & SM_ERROR);
			}			
		}
	}
	if ($em & EM_ALLSRV) {
		foreach my $e (@{$events{Allsrv}{E}}) {
			$ids{$e->{id}} = 1;
			if ($e->{Severity} =~ /info/i) {
				$ids{$e->{id}} = ($sm & SM_INFO);
			}
			if ($e->{Severity} =~ /warning/i) {
				$ids{$e->{id}} = ($sm & SM_WARNING);
			}
			if ($e->{Severity} =~ /error/i) {
				$ids{$e->{id}} = ($sm & SM_ERROR);
			}				
		}
	}
	if ($em & EM_ADMIN) {
		foreach my $e (@{$events{Admin}{E}}) {
			$ids{$e->{id}} = 1;
			if ($e->{Severity} =~ /info/i) {
				$ids{$e->{id}} = ($sm & SM_INFO);
			}
			if ($e->{Severity} =~ /warning/i) {
				$ids{$e->{id}} = ($sm & SM_WARNING);
			}
			if ($e->{Severity} =~ /error/i) {
				$ids{$e->{id}} = ($sm & SM_ERROR);
			}				
		}
	}
	
	#finally create the list of ids
	my @final = ();
	foreach (keys(%ids)) {push(@final,$_) if ($ids{$_} > 0);}
	$sql .= join( ',', map { $dbeh->quote( $_ ) } @final ) .')';
	
	return $sql;
}

# Creates WHERE (and AND) SQL clauses based on GameTypeMask (similar to above, instead here the masks turn things off)
sub gamefilterSQL {
	my ($gm,$where) = @_;
	my $sql = ($where) ? ' AND ' : 'WHERE ';
	$sql .= 'bIsGoalConquest = 0 AND ' if ($gm & GM_CONQUEST);
	$sql .= 'bIsGoalTeamKills = 0 AND ' if ($gm & GM_DEATHMATCH);
	$sql .= 'bIsGoalFlags = 0 AND ' if ($gm & GM_FLAGS);
	$sql .= 'bIsGoalArtifacts = 0 AND ' if ($gm & GM_ARTIFACTS);
	$sql .= 'bIsGoalProsperity = 0 AND ' if ($gm & GM_PROSPERITY);
	$sql .= 'bIsGoalCountdown = 0' if ($gm & GM_COUNTDOWN);
	$sql =~ s/AND $//i;	
	
	return $sql;
}

# Creates WHERE (and AND) SQL clauses based on SortAlpha charecter
sub alphafilterSQL {
	my ($sa,$where) = @_;
	my $sql = ($where) ? ' AND ' : 'WHERE ';
	$sql .= ($sa eq '#') ? "szName NOT REGEXP '^\\w'" : "szName LIKE '$sa%'";
		
	return $sql;
}

# Plucks an Event out of AGCEvents.xml by EventID
sub GetAGCEventDetails {
	my $eid = shift;
	open FILE, "$dir/AGCEvents.json" or die "Couldn't read $dir/AGCEvents.json $!";
	my $json = do { local $/; <FILE> };
	close FILE;
	$json = decode_json $json;
	my %events = %$json;
	
	if ($events{AGC}{H} >= $eid && $events{AGC}{L} <= $eid) {
		
		foreach my $e (@{$events{AGC}{E}}) {
			if ($e->{id} == $eid) {
				$e->{type} = "AGC";
				
				return $e;
			}
		}	
	} elsif($events{Allsrv}{H} >= $eid && $events{Allsrv}{L} <= $eid) {
		foreach my $e (@{$events{Allsrv}{E}}) {
			if ($e->{id} == $eid) {
				$e->{type} = "Allsrv";
				
				return $e;
			}
		}	
	} else {
		foreach my $e (@{$events{Admin}{E}}) {
			if ($e->{id} == $eid) {
				$e->{type} = "Admin";
				
				return $e;
			}
		}	
	}
	
	die "Couldn't find Event details for $eid in ".Dumper(\%events)."$!";
}

# Combines Data with Event to make an "EventResult", calls the c++ ATL/COM parser
sub FormatAGCEventResult {
	my ($event,$data) = @_;

	my $rdrfh; my $wtrfh; my @lines;
  	my $pid = open2($rdrfh, $wtrfh, "$dir/ObjRef2String.exe", "")  or die "Couldn't exec $dir/ObjRef2String.exe $!";
  	print $wtrfh $data->{ObjectRef}."\n";
  	close $wtrfh;
  	@lines = <$rdrfh>;
  	close $rdrfh;
  	
  	die "Fatal parser error, have you `regsvr32 AGC.dll?` $!" if (!scalar @lines && $data->{ObjectRef});
  	
  	#build a "Results log" (populated Format string)
  	my $logline = $event->{Format}; 
  	$logline =~ s/\\n/\<br\/\>/gi; #HTML
  	
  	# search & replace
  	my %props = ();  	
  	foreach my $line (@lines) {
  		$line =~ s/\n|\r//g;
  		next if (!$line);
  		my ($key,$val) = split(/\t/,$line);
  		my $origkey = $key;
  		$key =~ s/\s/\&nbsp\;/g;
  		my @v = split(/\,/,$val);
  		#consider the VT_DISPATCH
  		if (my $int = $dispatch{uc($v[0])}) {
  			$int->{GUID} = $v[0];
  			my $ref = TranscodeDispatch($int,$v[1]);
  			my %k = %{$ref->{Data}};
  			$val = "";
  			foreach my $ak (keys %k) {
  				my $vv = $k{$ak};
  				$val .= "$ak:$vv ";
  			}
  			delete $ref->{Data};
  			@{$props{$key}{values}}{Interface} = $ref;
  			@{$props{$key}{values}}{Data} = \%k;
  		} else {
  		  	$Text::Wrap::columns = 24;
  		  	my $count = 0;
  			foreach (@v) {
  			 	$v[$count] =~ s/\'|\"|\`//gi;
				$v[$count] = wrap('', '<br/>',$_);
				$v[$count] =~ s/^\<br\>//i;
				$count++;
  			}
  			@{$props{$key}{values}} = @v;
  		}
  		
  		$Text::Wrap::columns = 28;
  		$val =~ s/\'|\"|\`//gi;
  		$val =~ s/^\s//gi;
		$val = wrap('', '<br/>',$val); 
		
  		$logline =~ s/\%$origkey\%/$val/gi;
  		$origkey = ".".$origkey;
  		$logline =~ s/\%$origkey\%/$val/gi;
  	}
  	

	#these are always available regardless of ObjRef2String
	$logline =~ s/\%.ComputerName\%/$data->{ComputerName}/gi;
	$logline =~ s/\%ComputerName\%/$data->{ComputerName}/gi;
	$logline =~ s/\%SubjectName\%/$data->{SubjectName}/gi;
	$logline =~ s/\%.SubjectName\%/$data->{SubjectName}/gi;
	$logline =~ s/\%SubjectID\%/$data->{Subject}/gi;
	$logline =~ s/\%.SubjectID\%/$data->{Subject}/gi;
	$logline =~ s/\%Context\%/$data->{Context}/gi;
	$logline =~ s/\%.Context\%/$data->{Context}/gi;
	$logline =~ s/\%Time\%/$data->{DateTime}/gi;
	$logline =~ s/\%.Time\%/$data->{DateTime}/gi;
	$logline =~ s/\%ID\%/$data->{Event}/gi;
	$logline =~ s/\%.ID\%/$data->{Event}/gi;	

	if (length $data->{SubjectName} >= 25) {
		$data->{SubjectName} = lc(substr($data->{SubjectName},0,18));
		$data->{SubjectName} .= "...";
	} 
	
	#save the decoded AGC Object Reference to JSON
  	$event->{Props} = \%props;
  	$event->{Results} = (scalar keys %props) ? $logline : "ObjRef2String Error";
  	
  	#include the rest of the data with the event
  	$event->{eid} = $data->{eid};
  	$event->{gid} = $data->{gid};
  	$event->{timeEnter} = $data->{timeEnter};
  	$event->{Context} = $data->{Context};
  	$event->{SubjectName} = $data->{SubjectName};
  	$event->{Subject} = $data->{Subject};
  	$event->{ComputerName} = $data->{ComputerName};
  	$event->{DateTime} = $data->{DateTime};
  	delete $event->{Format}; # no need to send this...

	#attempt to find the timezone of the event	
	my $localdt = DateTime::Format::SQLite->parse_datetime($data->{DateTime});
	my $eventdt = DateTime::Format::SQLite->parse_datetime($data->{timeEnter});
	my $utc_diff = $eventdt->subtract_datetime_absolute($localdt);
	my $offset = $utc_diff->seconds / 3600; my $sign = "+";
	my $hours = $offset; my $db_local;
	if ($utc_diff->seconds >= 0) {
		#round up to nearest hour
		$offset += 0.5;
		$offset = floor($offset);
		$db_local = $localdt->add(hours => $offset);
		$sign="-";
	} else {
		#round down to nearest hour
		$offset -= 0.5;
		$offset = ceil($offset);
		$sign="+";
		$db_local = $localdt->subtract(hours => $offset);
	}
	$sign = "&plusmn;" if $offset == 0;
  	$offset = ($offset < 10 && $offset > 0) ? '0'.$offset : $offset;
  	$event->{TZ} = sprintf("%s&nbsp;(UTC%s%s)",$tz{$offset * -1},$sign,$offset);  	
  	
  	#find the validility (TZ checker & 2 min. latency MAX/MIN)
  	my $local_diff = $eventdt->subtract_datetime_absolute($db_local);
  	my $seconds = ($local_diff->seconds < 0) ? $local_diff->seconds * -1 : $local_diff->seconds;
  	$seconds = "<1" if ($seconds <= 2); #a harmless fib
  	$event->{Lag} = $seconds;
  	$event->{Valid} = ($tz{$offset * -1} && $seconds < 120) ? 1 : 0;

	return $event;
}

# Decodes the Base64, unpacks the binary as defined by the objects IPersistStream::Save() function then encodes to JSON
sub TranscodeDispatch {
	my ($hashref,$value) = @_;
	my $binary = decode_base64($value);

	# unpacker setup
	my $c = Convert::Binary::C::Cached->new(Cache   => "$dir/AGCIDL_pl.c");
	$c->configure(FloatSize  => 4, UnsignedChars => 0,  Alignment => 4);
	$c->parse_file("$dir/AGCIDL.h");
	$hashref->{Data} = ($c->sizeof($hashref->{IID}) == length $binary) ? $c->unpack($hashref->{IID},$binary) : die "Error: Binary was incorrect size! $!";
	
	return $hashref;
}


# Generates perl hash from JSON
sub FormatMissionParams {
	my $string = shift;
	return if length($string) <= 1;
	my $jp = decode_json $string;
	$Text::Wrap::columns = 24;	
	$jp->{nNeutralSectorTreasureRate} = sprintf("%.2f",$jp->{nNeutralSectorTreasureRate} * 60);
	$jp->{nPlayerSectorTreasureRate} = sprintf("%.2f",$jp->{nPlayerSectorTreasureRate} * 60);
	$jp->{strGameName} =~ s/\'|\"|\`//gi;
	$jp->{strGameName} = wrap('', '<br/>',$jp->{strGameName}); 
	return $jp;
}


#
## End of File - Imago 9/10