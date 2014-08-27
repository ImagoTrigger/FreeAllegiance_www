#!/usr/bin/perl
# Imago <imagotrigger@gmail.com>
## Parses the POST from AllSrv (when AGCEvents are sent periodically) 
## and processes the data for inserting into a DB

use strict;
use CGI qw(:standard -nph);
use CGI::Carp qw (fatalsToBrowser);  
use DBI;
use XML::Dumper;
use Data::Dumper;

#setup & modes! cool...
my $TEST = 0; #SET TO 1 AND SPECIFIY A FILE BELOW FOR A DRY RUN /W VERBOSE OUTPUT
my $LZMA = 0; #do 7z extraction? (yes as of 8/15/10, only works in test mode as of 8/25/10)
my $upload_dir = 'C:\Inetpub\wwwroot\build\AllegSkill\Stats'; #where files from the POST are stored
my $c_dir = 'C:\Inetpub\wwwroot\build\AllegSkill'; #where stats.h is and where you test from (working dir)

#a little HTTP handler setup
$| = 1;
$CGI::POST_MAX = 2097152000; 
my $query = new CGI;  
my $filename = $query->param("AGCEvents");  
print $query->header ();  

# TODO extend this check to look in AllLobbys Allegiance.cfg file for the remote ip addr
if ($query->user_agent() ne 'AllSrv agc post thread' && $TEST != 1) {
	print "OK";
	exit 0;
}

## process the "upload"
my $upload_filehandle = $query->upload("AGCEvents");  
if (!$TEST)  {
	open ( UPLOADFILE, ">$upload_dir\\$filename" ) or die "$!";  
	binmode UPLOADFILE;  
	print UPLOADFILE while ( <$upload_filehandle> )  ;
	close UPLOADFILE;  
	if ($query->param("LZMA")) {
		my $unc = $filename;
		my $cmd = "\"C:\\Program Files\\7-Zip\\7z.exe\" x -o$upload_dir $upload_dir\\$filename";
		`$cmd`;
		$unc =~ s/\.log$//;
		open(FILE,"$upload_dir\\$unc") or die $!; 
	} else {
		open(FILE,"$upload_dir\\$filename") or die $!;
	}
} else {
	#FILE USED WHEN IN TEST MODE
	if ($LZMA) {
		my $file = "$c_dir\\AGCevents-5813536-109464178"; # AN LZMA ENCODED FILE
		my $unc = $file;
		my $cmd3 = "\"C:\\Program Files\\7-Zip\\7z.exe\" x $c_dir\\$file";
		$unc =~ s/\.log$//;
		unlink $unc;
		system($cmd3);
		open(FILE,$unc); 
	} else {	
		open(FILE,"$c_dir\\AGCevents-5813536-109464178.log"); # AN UNENCODED FILE
	}
}

## the database
my $dbfile = "C:/Inetpub/wwwroot/build/AllegSkill/events.db";
#unlink $dbfile;
our $dbh = DBI->connect("dbi:SQLite:dbname=$dbfile","","") or die $!;
#CreateEventLogTable();
our $inse = $dbh->prepare(q{INSERT INTO EventResults (gid, Event, DateTime, ComputerName, Subject, SubjectName, Context, ObjectRef, timeEnter)
		values (?,?,?,?,?,?,?,?,DATETIME('NOW'))}) or die $!;
		
## begin the text parsing for events
my @lines = <FILE>;
close FILE;
foreach (@lines) {
	my ($date,$event,$subjectid,$computer,$subject,$context,$refenc) = split(/\t/,$_);
	chomp $refenc;
	if ($event > 0) {
		InsertEventResult (-1,$event,$date,$computer,$subjectid,$subject,$context,$refenc);
		if ($event == 2031) {
			my $cmd = qq{perl $c_dir\\IdentifyGameEvents.pl $context "$date" }.$dbh->sqlite_last_insert_rowid();
			`$cmd`;
		}
	}
}
## end the text parsing

## the reply
print "POSTED\n";
$inse->finish;
$dbh->disconnect;
exit 0;

sub InsertEventResult {
	if (!$TEST) {
		$inse->execute(@_) or die $!;
	} else {
		print "\n\tEvent\n\t------\n";
		print Dumper(@_);			
	}
	return;	
}

sub CreateEventLogTable() {
	$dbh->do(qq{CREATE TABLE EventResults (
	eid   				INTEGER PRIMARY KEY,
	gid				INTEGER,
	Event				INTEGER,
	DateTime			DATE,
	ComputerName			VARCHAR(15),
	Subject				INTEGER,
	SubjectName			VARCHAR(32),
	Context				VARCHAR(24),
	ObjectRef			VARCHAR(4000),
	timeEnter			DATE);}) or die $!;
	
	return;
 }

__END__
