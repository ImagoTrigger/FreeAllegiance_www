# Imago <imagotrigger@gmail.com>
## Creates the tables to store data

use strict;
use DBI;

unlink 'stats.db';
my $dbfile = "stats.db";
our $dbh = DBI->connect("dbi:SQLite:dbname=$dbfile","","");

CreateStatsTables();
CreateParamsTable();

$dbh->disconnect;
exit 0;

sub CreateParamsTable() {
	$dbh->do(qq{CREATE TABLE MissionParams (
	mpid   			INTEGER PRIMARY KEY,
	gid      			INTEGER,
	JSON				TEXT;});
	return;
}

sub CreateStatsTables() {
	$dbh->do(qq{CREATE TABLE GameResults (
	gid   			INTEGER PRIMARY KEY,
	szGameID      		VARCHAR(18),
	szName        		VARCHAR(65),
	szWinningTeam 		VARCHAR(21),
	nWinningTeamID 	INTEGER,
	bIsGoalConquest 	BOOLEAN,
	bIsGoalCountdown 	BOOLEAN,
	bIsGoalTeamKills 	BOOLEAN,
	bIsGoalProsperity 	BOOLEAN,
	bIsGoalArtifacts	BOOLEAN,
	bIsGoalFlags 		BOOLEAN,
	nGoalConquest 		INTEGER,
	nGoalCountdown 	INTEGER,
	nGoalTeamKills 	INTEGER,
	fGoalProsperity 	FLOAT,
	nGoalArtifacts 	INTEGER,
	nGoalFlags 		INTEGER,
	nDuration 		INTEGER,
	timeEnter 		DATE);});

	$dbh->do(qq{CREATE TRIGGER insert_GameResults_timeEnter AFTER INSERT ON GameResults BEGIN UPDATE GameResults SET timeEnter = DATETIME('NOW') WHERE rowid = new.rowid; END;});

	$dbh->do(qq{CREATE TABLE TeamResults (
	tid   					INTEGER PRIMARY KEY,
	gid						INTEGER,
	szGameID					VARCHAR(18),
	nTeamID					INTEGER,
	szName					VARCHAR(25),
	szTechs					VARCHAR(101),
	nCivID					INTEGER,
	cPlayerKills				INTEGER,
	cBaseKills				INTEGER,
	cBaseCaptures				INTEGER,
	cDeaths					INTEGER,
	cEjections				INTEGER,
	cFlags					INTEGER,
	cArtifacts				INTEGER,
	nConquestPercent			INTEGER,
	nProsperityPercentBought		INTEGER,
	nProsperityPercentComplete	INTEGER,
	nTimeEndured 				INTEGER);});

	$dbh->do(qq{CREATE TABLE PlayerResults (
	pid   			INTEGER PRIMARY KEY,
	gid				INTEGER,
	szGameID			VARCHAR(18),
  	nTeamID			INTEGER,
  	szName			VARCHAR(32),
  	cPlayerKills		INTEGER,
	cBuilderKills		INTEGER,
	cLayerKills		INTEGER,
	cMinerKills		INTEGER,
	cBaseKills		INTEGER,
	cBaseCaptures		INTEGER,
	cPilotBaseKills	INTEGER,
	cPilotBaseCaptures	INTEGER,
	cDeaths			INTEGER,
	cEjections		INTEGER,
	cRescues			INTEGER,
	cFlags			INTEGER,
	cArtifacts		INTEGER,
	cTechsRecovered	INTEGER,
	cAlephsSpotted		INTEGER,
	cAsteroidsSpotted	INTEGER,
  	fCombatRating		FLOAT,
  	fScore			FLOAT,
  	nTimePlayed		INTEGER,
  	nTimeCmd			INTEGER,
  	bWin				BOOLEAN,
  	bLose			BOOLEAN,
  	bWinCmd			BOOLEAN,
  	bLoseCmd			BOOLEAN,
  	CharacterID		INTEGER);});
	return;
}