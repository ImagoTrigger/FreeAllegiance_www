#if 0
*(
*  'cfg' => {
*    'Define' => [],
*    'StdCVersion' => 199901,
*    'ByteOrder' => 'LittleEndian',
*    'LongSize' => 4,
*    'IntSize' => 4,
*    'Cache' => 'C:\\Inetpub\\wwwroot\\build\\AllegSkill\\stats.c',
*    'HostedC' => 1,
*    'ShortSize' => 2,
*    'HasMacroVAARGS' => 1,
*    'Assert' => [],
*    'UnsignedChars' => 0,
*    'DoubleSize' => 8,
*    'CharSize' => 1,
*    'EnumType' => 'Integer',
*    'PointerSize' => 4,
*    'EnumSize' => 4,
*    'DisabledKeywords' => [],
*    'FloatSize' => 4,
*    'Alignment' => 8,
*    'LongLongSize' => 8,
*    'LongDoubleSize' => 12,
*    'KeywordMap' => {},
*    'Include' => [],
*    'HasCPPComments' => 1,
*    'Bitfields' => {
*      'Engine' => 'Generic'
*    },
*    'UnsignedBitfields' => 0,
*    'Warnings' => 0,
*    'CompoundAlignment' => 1,
*    'OrderMembers' => 0
*  },
*  'files' => {
*    'C:\\Inetpub\\wwwroot\\build\\AllegSkill\\stats.h' => {
*      'ctime' => 1283271950,
*      'mtime' => 1284679736,
*      'size' => 9945
*    }
*  },
*  'file' => 'C:\\Inetpub\\wwwroot\\build\\AllegSkill\\stats.h'
*);
#endif

/* typedef predeclarations */

typedef unsigned char bool;
typedef int Money;
typedef long Time;
typedef short CivID;
typedef short MapMakerID;


/* typedefs */

typedef
#line 7 "C:\Inetpub\wwwroot\build\AllegSkill\stats.h"
struct
{
	char strGameName[65];
	char szIGCStaticFile[13];
	char szCustomMapFile[13];
	char strGamePassword[17];
	bool bEjectPods:1;
	bool bInvulnerableStations:1;
	bool bShowMap:1;
	bool bAllowPrivateTeams:1;
	bool bAllowEmptyTeams:1;
	bool bAllowAlliedRip:1;
	bool bAllowAlliedViz:1;
	bool bAllowDevelopments:1;
	bool bAllowShipyardPath:1;
	bool bAllowTacticalPath:1;
	bool bAllowSupremacyPath:1;
	bool bAllowExpansionPath:1;
	bool bPowerUps:1;
	bool bAllowDefections:1;
	bool bAllowJoiners:1;
	bool bLockLobby:1;
	bool bLockSides:1;
	bool bLockTeamSettings:1;
	bool bLockGameOpen:1;
	bool bStations:1;
	bool bScoresCount:1;
	bool bSquadGame:1;
	bool bDrones:1;
	bool iResources:1;
	bool bResourceAmountsVisible:1;
	bool bRandomWormholes:1;
	bool bNoTeams:1;
	bool bShowHomeSector:1;
	bool bAllowFriendlyFire:1;
	bool bObjectModelCreated:1;
	bool bLobbiedGame:1;
	bool bClubGame:1;
	bool bAutoStart:1;
	bool bAutoRestart:1;
	bool bAllowRestart:1;
	bool bExperimental:1;
	float fGoalTeamMoney;
	int verIGCcore;
	float nPlayerSectorTreasureRate;
	float nNeutralSectorTreasureRate;
	float dtGameLength;
	float fHe3Density;
	Money m_killPenalty;
	Money m_killReward;
	Money m_ejectPenalty;
	Money m_ejectReward;
	Time timeStart;
	float fStartCountdown;
	float fRestartCountdown;
	CivID rgCivID[6];
	short iGoalConquestPercentage;
	short iGoalTerritoryPercentage;
	short iGoalArtifactsPercentage;
	short nGoalFlagsCount;
	short nGoalArtifactsCount;
	short nGoalTeamKills;
	short tsiPlayerStart;
	short tsiNeutralStart;
	short tsiPlayerRegenerate;
	short tsiNeutralRegenerate;
	float fStartingMoney;
	short iLives;
	MapMakerID mmMapType;
	short iMapSize;
	short iRandomEncounters;
	short bNeutralSectors;
	short iAlephPositioning;
	short iAlephsPerSector;
	short nTeams;
	short iMinRank;
	short iMaxRank;
	int nInvitationListID;
	short iMaxImbalance;
	short nPlayerSectorAsteroids;
	short nNeutralSectorAsteroids;
	short nPlayerSectorTreasures;
	short nNeutralSectorTreasures;
	short nPlayerSectorMineableAsteroids;
	short nNeutralSectorMineableAsteroids;
	short nPlayerSectorSpecialAsteroids;
	short nNeutralSectorSpecialAsteroids;
	unsigned char nMinPlayersPerTeam;
	unsigned char nMaxPlayersPerTeam;
	char nInitialMinersPerTeam;
	char nMaxMinersPerTeam;
	short nTotalMaxPlayersPerGame;
} MissionParams;

typedef
#line 111 "C:\Inetpub\wwwroot\build\AllegSkill\stats.h"
struct
{
	char szGameID[18];
	char szName[65];
	char szWinningTeam[25];
	short nWinningTeamID;
	char bIsGoalConquest;
	char bIsGoalCountdown;
	char bIsGoalTeamKills;
	char bIsGoalProsperity;
	char bIsGoalArtifacts;
	char bIsGoalFlags;
	short nGoalConquest;
	long nGoalCountdown;
	short nGoalTeamKills;
	float fGoalProsperity;
	short nGoalArtifacts;
	short nGoalFlags;
	long nDuration;
} GameResults;

typedef
#line 132 "C:\Inetpub\wwwroot\build\AllegSkill\stats.h"
struct
{
	char szGameID[18];
	short nTeamID;
	char szName[25];
	char szTechs[100];
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
	long nTimeEndured;
} TeamResults;

typedef
#line 151 "C:\Inetpub\wwwroot\build\AllegSkill\stats.h"
struct
{
	char szGameID[18];
	short nTeamID;
	char szName[32];
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
	long nTimePlayed;
	long nTimeCmd;
	char bWin;
	char bLose;
	char bWinCmd;
	char bLoseCmd;
	int CharacterID;
} PlayerResults;

