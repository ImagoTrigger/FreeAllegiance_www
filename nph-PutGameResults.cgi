#!/usr/bin/perl

# Imago <imagotrigger@gmail.com> 4/04 (iniital concept) 8/10 R6 implementation
## Unpacks the POST from AllSrv when a game completes
## and processed the data for inserting into a DB
## 9/10 added MissionParams to JSON (faster)

use strict;
use Convert::Binary::C::Cached;
use CGI qw(:standard -nph);
use CGI::Carp qw (fatalsToBrowser );  
use DBI;
use DBD::SQLite;
use JSON;
use Data::Dumper;

#setup & modes! cool...
my $TEST = 0; #SET TO 1 AND SPECIFIY A FILE BELOW FOR A DRY RUN /W VERBOSE OUTPUT
my $LZMA = 0; #do 7z extraction? (yes as of 8/15/10 only works in test mode as of 8/25/10)
my $upload_dir = 'C:\Inetpub\wwwroot\build\AllegSkill\Stats'; #where files from the POST are stored
my $c_dir = 'C:\Inetpub\wwwroot\build\AllegSkill'; #where stats.h is and where you test from (working dir)

#a little HTTP handler setup
$| = 1;
$CGI::POST_MAX = 2097152000; 
my $query = new CGI;  
my $filename = $query->param("Game");  
print $query->header ();  

# TODO extend this check to look in AllLobbys Allegiance.cfg file for the remote ip addr
if ($query->user_agent() ne 'AllSrv game post thread' && !$TEST) {
	print "OK";
	exit 0;
}

# unpacker setup
my $c = Convert::Binary::C::Cached->new(Cache   => $c_dir.'\stats.c',);
$c->configure(FloatSize  => 4, UnsignedChars => 0,  Alignment => 8);
$c->parse_file($c_dir.'\stats.h'); # keep in sync /w IGC.h & fsmission.h
##
$c->tag('MissionParams.strGameName', Format => 'String');
$c->tag('MissionParams.strGameName', Dimension => 65);
$c->tag('MissionParams.szIGCStaticFile', Format => 'String');
$c->tag('MissionParams.szIGCStaticFile', Dimension => 13);
$c->tag('MissionParams.szCustomMapFile', Format => 'String');
$c->tag('MissionParams.szCustomMapFile', Dimension => 13);
$c->tag('MissionParams.strGamePassword', Format => 'String');
$c->tag('MissionParams.strGamePassword', Dimension => 17);
$c->tag('MissionParams.rgCivID', Dimension => 6);
##
$c->tag('GameResults.szGameID', Format => 'String');
$c->tag('GameResults.szGameID', Dimension => 18);
$c->tag('GameResults.szName', Format => 'String');
$c->tag('GameResults.szName', Dimension => 65);
$c->tag('GameResults.szWinningTeam', Format => 'String');
$c->tag('GameResults.szWinningTeam', Dimension => 21);
##
$c->tag('TeamResults.szGameID', Format => 'String');
$c->tag('TeamResults.szGameID', Dimension => 18);
$c->tag('TeamResults.szName', Format => 'String');
$c->tag('TeamResults.szName', Dimension => 24);
$c->tag('TeamResults.szTechs', Format => 'Binary');
$c->tag('TeamResults.szTechs', Dimension => 101);
##
$c->tag('PlayerResults.szGameID', Format => 'String');
$c->tag('PlayerResults.szGameID', Dimension => 18);
$c->tag('PlayerResults.szName', Format => 'String');
$c->tag('PlayerResults.szName', Dimension => 32);

my $gs = $c->sizeof('GameResults');
my $ts = $c->sizeof('TeamResults');
my $ps = $c->sizeof('PlayerResults');
my $ms = $c->sizeof('MissionParams');

## process the "upload"
my $upload_filehandle = $query->upload("Game");  
if (!$TEST)  {
	open ( UPLOADFILE, ">$upload_dir\\$filename" ) or die "$!";  
	binmode UPLOADFILE;  
	print UPLOADFILE while ( <$upload_filehandle> )  ;
	close UPLOADFILE;  
	if ($query->param("LZMA")) {
		my $unc = $filename;
		my $cmd = "\"C:\\Program Files\\7-Zip\\7z.exe\" x -o$upload_dir $upload_dir\\$filename";
		`$cmd`;
		$unc =~ s/\.stats$//;
		open(FILE,"$upload_dir\\$unc") or die $!; 
	} else {
		open(FILE,"$upload_dir\\$filename") or die $!;
	}
} else {
	#FILE USED WHEN IN TEST MODE
	if ($LZMA) {
		my $file = "Game-20100815233928-8528-7540.stats"; # AN LZMA ENCODED FILE
		my $unc = $file;
		my $cmd3 = "\"C:\\Program Files\\7-Zip\\7z.exe\" x $c_dir\\$file";
		$unc =~ s/\.stats$//;
		unlink $unc;
		system($cmd3);
		open(FILE,$unc); 
	} else {	
		open(FILE,"Game-20100902231542-6068-6240.stats"); # AN UNENCODED FILE
	}
}

binmode FILE;
my $binary = "";


## the database
my $dbfile = "C:/Inetpub/wwwroot/build/AllegSkill/stats.db";
our $dbh = DBI->connect("dbi:SQLite:dbname=$dbfile","","") or die $!;

our $insg = $dbh->prepare(q{INSERT INTO GameResults (szGameID,szName,szWinningTeam,nWinningTeamID,bIsGoalConquest,
	bIsGoalCountdown,bIsGoalTeamKills,bIsGoalProsperity,bIsGoalArtifacts,bIsGoalFlags,nGoalConquest,nGoalCountdown,
	nGoalTeamKills, fGoalProsperity, nGoalArtifacts, nGoalFlags, nDuration)
		values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)}) or die $!;
		
our $inst = $dbh->prepare(q{INSERT INTO TeamResults (gid, szGameID, nTeamID,szName,szTechs,nCivID,cPlayerKills,cBaseKills,
	cBaseCaptures,cDeaths,cEjections,cFlags,cArtifacts,nConquestPercent,nProsperityPercentBought,nProsperityPercentComplete,nTimeEndured) 
		values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)}) or die $!;
		
our $insp = $dbh->prepare(q{INSERT INTO PlayerResults (gid, szGameID, nTeamID,szName, cPlayerKills,cBuilderKills,cLayerKills,cMinerKills,
	cBaseKills,cBaseCaptures,cPilotBaseKills,cPilotBaseCaptures,cDeaths,cEjections,cRescues,cFlags,cArtifacts,
	cTechsRecovered,cAlephsSpotted,cAsteroidsSpotted,fCombatRating,fScore,nTimePlayed,nTimeCmd,bWin,bLose,
	bWinCmd,bLoseCmd,CharacterID) 
		values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)}) or die $!;

our $inse = $dbh->prepare(q{INSERT INTO EventResults (gid, Event, DateTime, ComputerName, Subject, SubjectName, Context, ObjectRef)
		values (?,?,?,?,?,?,?,?)}) or die $!;
		
our $insmp = $dbh->prepare(q{INSERT INTO MissionParams (gid, JSON) values (?,?)}) or die $!;		


## begin the binary unpacking, dont touch this unless you know what you're doing
my $bnext = 0;
my $pc = 0;

## params (saved after game but read in first)...
read FILE, $binary, $ms;
my $params= $c->unpack('MissionParams',$binary) or die $!;

## game
seek FILE, $ms,0;
read FILE, $binary, $gs;
my $game = $c->unpack('GameResults',$binary) or die $!;
exit 1 if (length($game->{szGameID}) < 16);
my $gid = InsertGameResult($game);
$gs += $ms;

## ...now save params, lazily as JSON };-)
InsertGameParams($gid,encode_json $params);

## teams
TEAM:
seek FILE,$gs + ($bnext * $ts) + ($pc * $ps),0;
read FILE, $binary, $ts;
my $team = $c->unpack('TeamResults',$binary);
$team->{szTechs} =~ s/\W//gi;
$team->{gid} = $gid;
InsertTeamResult($team) if length $team->{szTechs} >= 98;
if (length($team->{szTechs}) < 98) {
	goto END;
}
$bnext++;

## players
my $iter2 = 0;
my $player = "";
my $blast = 0;
do {
	my $bin3 = "";  my $test = "";
	seek FILE, $gs + ($ts * $bnext) + ($ps * ($iter2+1)) + ($pc * $ps), 0;
	read FILE, $test, 18; 
	if ($test !~ /^$game->{szGameID}/ ) { #our blob chunks always start /w a game/context ID
		if ($test =~ /^\n/) { #our string stream always starts /w a new line
			$blast = 1;
		} else {
			$pc += $iter2;
			goto TEAM;
		}
	}
	seek FILE, $gs + ($ts * $bnext) + ($ps * $iter2) + ($pc * $ps), 0;
	read FILE, $bin3, $ps; 
	
	$player = $c->unpack('PlayerResults',$bin3);
	$player->{gid} = $gid;
	InsertPlayerResult($player)  if length $player->{szName} > 0 && $player->{CharacterID} > 0;	
	$iter2++;
} while(length $player->{szName} > 0 && !$blast);
## end the binary unpacking

## begin the text parsing for events
END:
seek FILE, $gs + ($ts * ($bnext) + ($ps * ($pc + 1)))+1, 0;
my $string = ""; my $line = "";
$string .= $line while (read(FILE,$line,4096) != 0);
$string .= "\n";
close FILE;
foreach (split(/\n/,$string)) {
	my ($date,$event,$subjectid,$computer,$subject,$context,$refenc) = split(/\t/,$_);
	chomp $refenc;
	InsertEventResult ($gid,$event,$date,$computer,$subjectid,$subject,$context,$refenc) if ($event > 0);
}
## end the text parsing

## the reply
print "POSTED\n";
$inse->finish;
$insg->finish;
$inst->finish;
$insp->finish;
$insmp->finish;
$dbh->disconnect;
exit 0;


## insert exec subs
sub InsertGameResult {
	my $game = shift;
	if (!$TEST) {
		$insg->execute($game->{szGameID},$game->{szName},$game->{szWinningTeam},$game->{nWinningTeamID},$game->{bIsGoalConquest},
		$game->{bIsGoalCountdown},$game->{bIsGoalTeamKills},$game->{bIsGoalProsperity},$game->{bIsGoalArtifacts},$game->{bIsGoalFlags},$game->{nGoalConquest},$game->{nGoalCountdown},
		$game->{nGoalTeamKills}, $game->{fGoalProsperity}, $game->{nGoalArtifacts}, $game->{nGoalFlags}, $game->{nDuration}) or die $!;
		return $dbh->sqlite_last_insert_rowid();
	} else {
		print "Game Results:\n--------------\n";
		print Dumper($game);
		return -1;
	}
}

sub InsertTeamResult {
	my $team = shift;
	if (!$TEST) {
		$inst->execute($team->{gid}, $team->{szGameID}, $team->{nTeamID},$team->{szName},$team->{szTechs},$team->{nCivID},$team->{cPlayerKills},$team->{cBaseKills},
		$team->{cBaseCaptures},$team->{cDeaths},$team->{cEjections},$team->{cFlags},$team->{cArtifacts},$team->{nConquestPercent},$team->{nProsperityPercentBought},
		$team->{nProsperityPercentComplete}, $team->{nTimeEndured});
	} else {
		print "\n\tTeam\n\t------\n";
		print Dumper($team);
	}
	return;
}

sub InsertPlayerResult {
	my $player = shift;
	if (!$TEST) {
		$insp->execute($player->{gid}, $player->{szGameID}, $player->{nTeamID},$player->{szName}, $player->{cPlayerKills},$player->{cBuilderKills},$player->{cLayerKills},$player->{cMinerKills},
		$player->{cBaseKills},$player->{cBaseCaptures},$player->{cPilotBaseKills},$player->{cPilotBaseCaptures},$player->{cDeaths},$player->{cEjections},$player->{cRescues},$player->{cFlags},$player->{cArtifacts},
		$player->{cTechsRecovered},$player->{cAlephsSpotted},$player->{cAsteroidsSpotted},$player->{fCombatRating},$player->{fScore},$player->{nTimePlayed},$player->{nTimeCmd},$player->{bWin},$player->{bLose},
		$player->{bWinCmd},$player->{bLoseCmd},$player->{CharacterID});
	} else {
		print "\n\t\tPlayer\n\t\t------\n";
		print Dumper($player);	
	}
	return;	
}

sub InsertEventResult {
	if (!$TEST) {
		$inse->execute(@_);
	} else {
		print "\n\tEvent\n\t------\n";
		print Dumper(@_);			
	}
	return;	
}

sub InsertGameParams {
	if (!$TEST) {
		$insmp->execute(@_);
	} else {
		print "\n\tParams\n\t------\n";
		print Dumper(@_);		
	}
	return;	
}

__END__
