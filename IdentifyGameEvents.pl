#!/usr/bin/perl
# Imago <imagotrigger@gmail.com>
## Relates AGC Events with Games (EventResuts!)
## This will allow for faster (indexed) scans when post-processing for TrueSkill (balance database updates/inserts)

use strict;
use DBI;
use DateTime::Format::SQLite;
use Data::Dumper;

my ($context,$date,$eid) = @ARGV;
die "Usage: IdentifyGameResults.pl <GameContext> <GameOverEventLocalTime> <GameOverEventID>\n" if (!$context || !$date || !$eid);

#setup the databases
my $dbefile = "C:/Inetpub/wwwroot/build/AllegSkill/events.db";
our $dbeh = DBI->connect("dbi:SQLite:dbname=$dbefile","","") or die $!;
my $dbsfile = "C:/Inetpub/wwwroot/build/AllegSkill/stats.db";
our $dbsh = DBI->connect("dbi:SQLite:dbname=$dbsfile","","") or die $!;

#and queries
our $seledt = $dbeh->prepare(q{SELECT timeEnter, ComputerName FROM EventResults WHERE eid = ?}) or die $!;
our $sele = $dbeh->prepare(q{SELECT eid FROM EventResults WHERE Context = ? AND ComputerName = ? AND (DateTime <= ? AND DateTime >= ?)}) or die $!;
our $sels = $dbsh->prepare(q{SELECT gid,timeEnter, nDuration FROM GameResults WHERE szGameID = ? AND (timeEnter <= ? AND timeEnter >= ?)}) or die $!;

#obtain the database timestamp for the AGC 2031 event
$seledt->execute($eid) or die $!;
my $te; my $comp;
$seledt->bind_columns(\$te,\$comp) or die $!;
$seledt->fetch;

die $! if (!$te);
my $dt = DateTime::Format::SQLite->parse_datetime($te);

#create a 10 second window arount it used for sanity checking
my $dtahead = DateTime::Format::SQLite->parse_datetime($te);
$dtahead->add(seconds => 10);
my $dtbehind = DateTime::Format::SQLite->parse_datetime($te);
$dtbehind->subtract(seconds => 10);

#find the game that matches it
$sels->execute($context,DateTime::Format::SQLite->format_datetime($dtahead),DateTime::Format::SQLite->format_datetime($dtbehind)) or die $!;
my $gid; my $duration; my $teactual;
$sels->bind_columns(\$gid,\$teactual,\$duration) or die $!;
$sels->fetch or die $!;

die $! if (!$duration);

#determine the lag-time from game end post to agc event log post
my $dtactual = DateTime::Format::SQLite->parse_datetime($teactual);
my $dur = $dt->subtract_datetime_absolute($dtactual);

#create the event log window for the game's duration
my $dtback = DateTime::Format::SQLite->parse_datetime($date);
$dtback->subtract(seconds => $duration+15+$dur->seconds()); # game duration + countdown + proceesing / lag

#make a list of eventids
$sele->execute($context,$comp,$date,DateTime::Format::SQLite->format_datetime($dtback)) or die $!;
my $id; my @eids = ();
$sele->bind_columns(\$id) or die $!;
push(@eids,$id) while $sele->fetch;

die $! if (!scalar @eids);

#update the events with the game id
my $sql = sprintf 'UPDATE EventResults SET gid = ? WHERE eid IN ( %s )', join( ',', map { $dbeh->quote( $_ ) } @eids );
my $upd = $dbeh->prepare($sql);
$upd->execute($gid);

#tada
$upd->finish;
$sels->finish;
$sele->finish;
$seledt->finish;
$dbeh->disconnect;
$dbsh->disconnect;
exit 0;
