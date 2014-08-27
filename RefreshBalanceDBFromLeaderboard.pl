#Imago <imagotrigger@gmail.com>
# Runs every 10 minutes from task.bat which is on CDN's Task Scheduler

use strict;
use DBI;
use DBD::SQLite;
use WWW::Mechanize;
use WWW::Mechanize::GZip;

my $dbfile = "C:/Inetpub/wwwroot/build/AllegSkill/balance.db";
my $cachepath = "C:/Inetpub/wwwroot/build/AllegSkill";

our $dbh = DBI->connect("dbi:SQLite:dbname=$dbfile","","");

#CreateBalanceTables();

our $sel = $dbh->prepare(q{SELECT bid,mu,sigma,rank FROM balance WHERE name = ?});
our $upd = $dbh->prepare(q{UPDATE balance SET mu = ?, sigma = ?, rank = ? WHERE bid = ?});
our $ins = $dbh->prepare(q{INSERT INTO balance (name,mu,sigma,rank) values (?,?,?,?)});

my $mech = WWW::Mechanize::GZip->new();
$mech->agent_alias( 'Windows IE 6' );
my $r = $mech->get( "http://leaderboard.alleg.net/" );
my $output;
my $lastid;
my $wall = $mech->content( format => 'text' );
if ($wall =~ /Processed:(\d+)/) {
	$lastid = $1;
}

open(LID,"$cachepath/lid");
my $lid = <LID>;
close LID;

goto EXIT if ($lid >= $lastid);

open(LID,">$cachepath/lid");
print LID $lastid;
close LID;

my @rows = split(m/\<\/tr\>/i,$r->content);
my $name;
my $sigma;
my $mu;
my $rank = -1;
foreach my $row (@rows) {
	if ($row =~ /LeaderboardRow/) {
		if ($row =~ /\<td\>(.*?)\<\/td\>/) {
			$name = $1;
			chomp $name;
		}
		my @cols = split(/\<td align\=\"right\"\>/,$row);
		my $colcnt = 0;
		foreach my $col (@cols) {
			if ($col =~ /(.*?)\</ && $colcnt == 2) {
				$mu = $1;
			}
			if ($col =~ /(.*?)\</ && $colcnt == 3) {
				$sigma = $1;
			}
			if ($col =~ /(.*?)\</ && $colcnt == 4) {
				$rank = $1;
				last;
			}			
			$colcnt++;
		}
	} else {
		next;
	}
	
	if ($mu && $sigma && $rank != -1) {
		my ($bid, $lmu, $lsigma, $lrank) = SelectBalanceData($name);
		($bid > 0) ? UpdateBalanceData($bid, $mu, $sigma, $rank) : InsertBalanceData($name, $mu, $sigma, $rank);
	}
}

EXIT:
$sel->finish;
$upd->finish;
$ins->finish;
$dbh->disconnect;
exit 0;


sub InsertBalanceData($) {
	my ($name, $mu, $sigma, $rank) = @_;
	$ins->execute($name,$mu,$sigma,$rank);
	return;
}

sub SelectBalanceData($) {
	$sel->execute(shift);
	my @data; my $bid; my $mu; my $sigma; my $rank;
	$sel->bind_columns(\$bid, \$mu,\$sigma,\$rank);
	$sel->fetch;
	return ($bid, $mu,$sigma,$rank);
}

sub UpdateBalanceData($) {
	my ($bid, $mu, $sigma, $rank) = @_;
	$upd->execute($mu,$sigma,$rank,$bid);
	return;
}

sub CreateBalanceTables() {
	$dbh->do(qq{
CREATE TABLE balance (
	bid       INTEGER PRIMARY KEY,
	name      VARCHAR(12),
	mu        NUMERIC(2,2),
	sigma     NUMERIC(2,2),
	rank      INTEGER,
	timeEnter DATE
);});
	$dbh->do(qq{
CREATE TABLE balancelog (
	blid 		INTEGER PRIMARY KEY,
	bid 		INTEGER,
	bidOLD	 	INTEGER,
	nameNEW 	VARCHAR(12),
	muNEW   	NUMERIC(2,2),
	sigmaNEW	NUMERIC(2,2),
	rankNEW		INTEGER,
	nameOLD		VARCHAR(12),
	muOLD	        NUMERIC(2,2),
	sigmaOLD	NUMERIC(2,2),
	rankOLD		INTEGER	,
	sqlAction 	VARCHAR(15),
	timeEnter    	DATE,
	timeUpdate   	DATE,
	timestamp       DATE
);});

$dbh->do(qq{CREATE TRIGGER update_balancelog AFTER UPDATE ON balance BEGIN INSERT INTO balancelog (bid,bidOLD,nameOLD,nameNEW,muOLD,muNEW,sigmaOLD,sigmaNEW,rankOLD,rankNEW,sqlAction,timeEnter,timeUpdate,timestamp) values (new.bid,old.bid,old.name,new.name,old.mu,new.mu,old.sigma, new.sigma,old.rank,new.rank, 'UPDATE',old.timeEnter,DATETIME('NOW'),DATETIME('NOW') ); END;});
$dbh->do(qq{CREATE TRIGGER insert_balancelog AFTER INSERT ON balance BEGIN INSERT INTO balancelog (bid,nameNEW,muNEW,sigmaNEW,rankNEW, sqlAction,timeEnter,timestamp) values (new.bid,new.name,new.mu,new.sigma,new.rank,'INSERT',new.timeEnter,DATETIME('NOW') ); END;});
$dbh->do(qq{CREATE TRIGGER delete_balancelog DELETE ON balance BEGIN INSERT INTO balancelog (bid,nameOLD,muNEW,sigmaOLD,rankOLD,sqlAction,timeEnter) values (old.bid,old.name,old.mu,old.sigma,old.rank, 'DELETE',DATETIME('NOW') ); END;});
$dbh->do(qq{CREATE TRIGGER insert_balnce_timeEnter AFTER INSERT ON balance BEGIN UPDATE balance SET timeEnter = DATETIME('NOW') WHERE rowid = new.rowid; END;});

	return;
}

__END__