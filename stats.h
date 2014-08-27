typedef unsigned char bool;
typedef int Money;
typedef long Time;
typedef short CivID;
typedef short MapMakerID;

typedef struct {
    char        strGameName[65];              //Name of game
    char        szIGCStaticFile[13];          //Name of static IGC file
    char        szCustomMapFile[13];          //Name of custom Map file; used only if not blank
    char        strGamePassword[17];      //Password
    bool        bEjectPods          : 1;                //Are eject pods used
    bool        bInvulnerableStations : 1;              //Do station NOT take damage
    bool        bShowMap            : 1;                //Show all warps at the start of the game
    bool        bAllowPrivateTeams  : 1;
    bool        bAllowEmptyTeams    : 1;                //Allow teams without players
	bool		bAllowAlliedRip		: 1;				//Imago 7/8/09 ALLY
	bool		bAllowAlliedViz		: 1;				//Imago 7/11/09 ALLY
    bool        bAllowDevelopments  : 1;                //Allow investment in tech
    bool        bAllowShipyardPath  : 1;                //Allow building Shipyards
    bool        bAllowTacticalPath  : 1;                //Allow building Tactical Labs
    bool        bAllowSupremacyPath : 1;                //Allow building Supremacy Centers
    bool        bAllowExpansionPath : 1;                //Allow building Expansion Complexes
    bool        bPowerUps           : 1;                //Create treasure when a ship is destroyed
    bool        bAllowDefections    : 1;                //Allow players to switch from one team to another
    bool        bAllowJoiners       : 1;                //Allow players to join a game in progress
    bool        bLockLobby          : 1;                //Prevent new players from joining a game
    bool        bLockSides          : 1;                //Prevent players from switching sides
    bool        bLockTeamSettings   : 1;                //Prevent players from changing team attributes like name
    bool        bLockGameOpen       : 1;                //Prevent players from limiting the size of the game
    bool        bStations           : 1;        //??
    bool        bScoresCount        : 1;        //??
    bool        bSquadGame          : 1;        //??
    bool        bDrones             : 1;        //??
    bool        iResources          : 1;        //??
    bool        bResourceAmountsVisible : 1;    //??
    bool        bRandomWormholes    : 1;        //??
    bool        bNoTeams            : 1;        //??
    bool        bShowHomeSector     : 1;                //Show everything in a player's home sector at start of game
    bool        bAllowFriendlyFire  : 1;                //Allow friends to damage friends
    bool        bObjectModelCreated : 1;                //Was this game created by admin tools or the server app?
    bool        bLobbiedGame        : 1;                //Is this game listed in an internet lobby?
    bool        bClubGame           : 1;                //Is this game on the zone club?
    bool        bAutoStart          : 1;                //Does the game start automatically when all sides are ready?
    bool        bAutoRestart        : 1;                //Does the game restart automatically
    bool        bAllowRestart       : 1;                //Can the game be restarted at all?
	bool        bExperimental       : 1;                // mmf 10/07 Experimental game type
	float       fGoalTeamMoney;                         //Cost of win the game tech = fGoalTeamMoney * WinTheGameMoney, 0 == no win the game tech
    int         verIGCcore;                             //this is set only by the server, so the client can know whether it needs to get a new igc static core
    float       nPlayerSectorTreasureRate;              //# of treasures that generate/second in player sectors
    float       nNeutralSectorTreasureRate;             //                                       neutral
    float       dtGameLength;                           //Seconds till end of game, 0 == no limit
    float       fHe3Density;                            //Mulitplier on He3 found at asteroids
    Money       m_killPenalty;                  //Not used
    Money       m_killReward;                   //Not used
    Money       m_ejectPenalty;                 //Not used
    Money       m_ejectReward;                  //Not used

    Time        timeStart;                              //Time at which the game started
    float       fStartCountdown;                        //Countdown (seconds) between automatically restarting missions
    float       fRestartCountdown;                      //Countdown (seconds) between automatically restarting missions

    CivID       rgCivID[6];                   //IDs within the szIGCCore data set
    short       iGoalConquestPercentage;                //% of flagged stations that need to be held to win the game
    short       iGoalTerritoryPercentage;               //sole control of % of territories
    short       iGoalArtifactsPercentage;       //Not used
    short       nGoalFlagsCount;                        //# of enemy flags returned to station to win
    short       nGoalArtifactsCount;                    //# of neutral artifacts returned to station to win
    short       nGoalTeamKills;                         //Number of kills required to end the game
    short       tsiPlayerStart;                         //Treasure index for random treasures that start in player sectors. NA == none
    short       tsiNeutralStart;                        //                                                  neutral
    short       tsiPlayerRegenerate;                    //Treasure index for random treasures that spawn in player sectors, NA = none
    short       tsiNeutralRegenerate;                   //                                                  neutral
    float       fStartingMoney;                         //Multiplier on team starting money
    short       iLives;                                 //Player must die more than this number of times to be exit, c_cUnlimitedLives = unlimited
    MapMakerID  mmMapType;                              //Map type
    short       iMapSize;								//KGJV: non zero value = 2 starting garrisons
    short       iRandomEncounters;                      //Use to indicate how many alephs are randomly removed
    short       bNeutralSectors;                //Not used
    short       iAlephPositioning;              //Not used
    short       iAlephsPerSector;               //Not used
    short       nTeams;                                 //Number of sides in the game
    short       iMinRank;                               //Minimum player rank
    short       iMaxRank;                               //Maximum player rank
    int         nInvitationListID;                      // zero means no invitation required

    short       iMaxImbalance;                          //Maximum allowed difference between smallest and largest team

    short       nPlayerSectorAsteroids;                 //# generic asteroids in player sector
    short       nNeutralSectorAsteroids;                //                       neutral

    short       nPlayerSectorTreasures;                 //# of treasures placed in player sector to start with
    short       nNeutralSectorTreasures;                //                         neutral

    short       nPlayerSectorMineableAsteroids;         //# of He3 asteroids in player sector
    short       nNeutralSectorMineableAsteroids;        //                      neutral

    short       nPlayerSectorSpecialAsteroids;          //# of special asteroids (C, U or Si) in player sector
    short       nNeutralSectorSpecialAsteroids;         //                                       neutral

    unsigned char nMinPlayersPerTeam;                   //Min players on team
    unsigned char nMaxPlayersPerTeam;                   //Max players on team

    char        nInitialMinersPerTeam;                  //Number of miners to start the game with
    char        nMaxMinersPerTeam;                      //Maximum # of miners a team is allowed to control

    short       nTotalMaxPlayersPerGame;                //Maximum # of players per game (mostly used for StandAlone server)} MissionParams;
    } MissionParams;


typedef struct {
  char  szGameID      [18];
  char  szName        [65];
  char  szWinningTeam [25];
  //char	szCore		  [21];
  short nWinningTeamID;
  char  bIsGoalConquest;
  char  bIsGoalCountdown;
  char  bIsGoalTeamKills;
  char  bIsGoalProsperity;
  char  bIsGoalArtifacts;
  char  bIsGoalFlags;
  short nGoalConquest;
  long  nGoalCountdown;
  short nGoalTeamKills;
  float fGoalProsperity;
  short nGoalArtifacts;
  short nGoalFlags;
  long  nDuration;
} GameResults;

typedef struct {
  char  szGameID[18];
  short nTeamID;
  char  szName[25];
  char  szTechs[100];
  short nCivID;
  short cPlayerKills;
  short cBaseKills;
  short cBaseCaptures;
  short cDeaths;
  short cEjections;
  short cFlags;
  short cArtifacts;
  short nConquestPercent;
  short nProsperityPercentBought;
  short nProsperityPercentComplete;
  long  nTimeEndured;
} TeamResults;

typedef struct {
  char  szGameID[18];
  short nTeamID;
  char  szName[32]; //Imago #192
  short cPlayerKills;
  short cBuilderKills;
  short cLayerKills;
  short cMinerKills;
  short cBaseKills;
  short cBaseCaptures;
  short cPilotBaseKills;
  short cPilotBaseCaptures;
  short cDeaths;
  short cEjections;
  short cRescues;
  short cFlags;
  short cArtifacts;
  short cTechsRecovered;
  short cAlephsSpotted;
  short cAsteroidsSpotted;
  float fCombatRating;
  float fScore;
  long  nTimePlayed;
  //#50 added
  long  nTimeCmd;
  char  bWin;
  char  bLose;
  char  bWinCmd;
  char  bLoseCmd;
  int CharacterID;
} PlayerResults;