#Imago <imagotrigger@gmail.com>

use strict;  
use CGI qw(:standard -nph);
use CGI::Carp qw ( fatalsToBrowser );  
use File::Basename;  
use Archive::Extract;
use Data::Dumper;
use Win32::GuiTest qw(WaitWindow PushChildButton FindWindowLike GetWindowText SetForegroundWindow SendKeys);
use Win32::Process qw(STILL_ACTIVE NORMAL_PRIORITY_CLASS INFINITE DETACHED_PROCESS CREATE_NEW_CONSOLE CREATE_NEW_PROCESS_GROUP);
use Email::MIME;
use File::Copy;
use MIME::Lite;

$Archive::Extract::WARN = 0;
$| = 1;
$CGI::POST_MAX = 2097152000; 
my $safe_filename_characters = "a-zA-Z0-9_.-";  
my $upload_dir = "C:\\Inetpub\\wwwroot\\build\\Dumps";  
 
 my @cores;
 my $uploadHTML = qq{<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
 <head>
   <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
   <title>Multi-dump checker</title>
 </head>
 <body>
   <form action="/CoreChecker/nph-Dump.cgi" method="post" enctype="multipart/form-data">
     <p>Dumps(s) to Upload: <input type="file" name="corefile" /></p>
     <p>Force use of the <b>latest Beta FZDebug</b> symbols only instead of auto-matching for FZRetail: <input type=checkbox name=debug>
     <p><input type="submit" name="Submit" value="Submit Form" /></p>
   </form>
 </body>
</html>};
 
 
my $query = new CGI;  
my $filename = $query->param("corefile");  
my $usedebug = $query->param("debug");

if ( !$filename )  
{  
print $query->header ();  
 print $uploadHTML;  
 exit;  
}  
 print $query->header ();  

my ( $name, $path, $extension ) = fileparse ( $filename, '\..*' );  
$filename = $name . $extension;  
$filename =~ tr/ /_/;  
$filename =~ s/[^$safe_filename_characters]//g;  
 
if ( $filename =~ /^([$safe_filename_characters]+)$/ )  
{  
 $filename = $1;  
}  
else  
{  
 die "Filename contains invalid characters";  
}  

print qq{  
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "DTD/xhtml1-strict.dtd">  
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">  
 <head>  
   <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />  
   <title>$filename</title>  
   <style type="text/css">  
     img {border: none;}  
   </style>  
 </head>  
 <body>  
};
 
if ( $filename =~ /\.7z|\.dmp|\.ms|\.tar|\.tgz|\.zip|\.bz2|\.tbz|\.lzma|\.gz/i )  {
 	my $upload_filehandle = $query->upload("corefile");  
	 
	open ( UPLOADFILE, ">$upload_dir\\$filename" ) or die "$!";  
	binmode UPLOADFILE;  
	 
	while ( <$upload_filehandle> )  
	{  
	 print UPLOADFILE;  
	}  
	 
	close UPLOADFILE;  
} else {
	die "Filename has invalid extention"; 
}

print "<link rel=STYLESHEET type=text/css href=http://build.alleg.net/CoreChecker/res/default.css title=default>";
print "<p>Upload completed!</p>" if $query->param("Submit");

 if ( $filename !~ /\.dmp$/i )  
{  
     my $ae = Archive::Extract->new( archive => $upload_dir."\\".$filename ) ;
     if (!$ae) {
		#try ?too TODO
		my $cmd = "\"C:\\Program Files\\7-Zip\\7z.exe\" x -y -o$upload_dir $upload_dir\\$filename";
		print "<br><pre>Trying $cmd" if $query->param("Submit"); 
		open(Z7,"$cmd |");
		while(<Z7>) { 
			my $line = $_;
			if ($line = /Extracting  (.*)/) {
				my $file = $1;
				chomp $file;
				push(@cores,$file);
			}
			print $_ if $query->param("Submit");
		}
		close Z7;
		sleep(1);
		print "</pre>" if $query->param("Submit");
	} else {
	     if (!$ae->extract(to => $upload_dir)) {
		 die "File failed to extract"; 	 
	     } else {
		my $files = $ae->files;
		my $file = @{$files}[0]; #grep TODO
		if ($file !~ /\.dmp/i) {
			die "Archive ($file) containes invalid files";
		}
		push(@cores,@{$files});
	     }
	}  
} else {
		$cores[0] = $filename;
}
my $sympath = "";
foreach my $core (@cores) {
	my $obj = $core;
	print "<p>Processing dump $core</p>" if $query->param("Submit");
	my $build = 0;
	my $beta = 0;
	if ($core =~ /-\d\.\d\d\.(\d+)\./) {
		my $rel = $1;
		$rel =~ s/^0//;
		$build = substr($rel, 0, -1);
		$beta = chop $rel;
	}	
	print "<pre>" if $query->param("Submit");
	if ($usedebug) {
		print "</pre><p><font color=red>Forcing latest Beta FZDebug symbols - Use your own analysis! - <b>The analysis shown below is probably wrong!</b></font><pre>\n";
		$obj = "Allegiance", $sympath = "C:\\build\\FAZR6\\objs10\\FZDebug\\WinTrek"  if ($core =~ /alleg/i);
		$obj = "AllSrv", $sympath = "C:\\build\\FAZR6\\objs10\\FZDebug\\FedSrv"  if ($core =~ /allsrv/i);	
		$obj = "AllSrvUI",$sympath = "C:\\build\\FAZR6\\objs10\\FZDebug\\AllSrvUI"  if ($core =~ /allsrvui/i);		
		$obj = "AGC",$sympath = "C:\\build\\FAZR6\\objs10\\FZDebug\\AGC"  if ($core =~ /agc/i);			
		$obj = "Reloader",$sympath = "C:\\build\\FAZR6\\objs10\\FZDebug\\Reloader"  if ($core =~ /reloader/i);				
		$obj = "AutoUpdate",$sympath = "C:\\build\\FAZR6\\objs10\\FZDebug\\AutoUpdate"  if ($core =~ /autoupdate/i);					
		$obj = "AllLobby",$sympath = "C:\\build\\FAZR6\\objs10\\FZDebug\\Lobby"  if ($core =~ /alllobby/i);					
	} else {
		if (!$build) {
			print "</pre><p><font color=red>This looks like a private build - or a pre R6 release - Use your own analysis! - <b>The analysis shown below is probably wrong!</b></font><pre>\n";
			$obj = "Allegiance", $sympath = "C:\\build\\FAZR6\\objs10\\FZDebug\\WinTrek"  if ($core =~ /alleg/i);
			$obj = "AllSrv", $sympath = "C:\\build\\FAZR6\\objs10\\FZDebug\\FedSrv"  if ($core =~ /allsrv/i);	
			$obj = "AllSrvUI",$sympath = "C:\\build\\FAZR6\\objs10\\FZDebug\\AllSrvUI"  if ($core =~ /allsrvui/i);		
			$obj = "AGC",$sympath = "C:\\build\\FAZR6\\objs10\\FZDebug\\AGC"  if ($core =~ /agc/i);			
			$obj = "Reloader",$sympath = "C:\\build\\FAZR6\\objs10\\FZDebug\\Reloader"  if ($core =~ /reloader/i);				
			$obj = "AutoUpdate",$sympath = "C:\\build\\FAZR6\\objs10\\FZDebug\\AutoUpdate"  if ($core =~ /autoupdate/i);					
			$obj = "AllLobby",$sympath = "C:\\build\\FAZR6\\objs10\\FZDebug\\Lobby"  if ($core =~ /alllobby/i);			
		} else {
			$obj = "Allegiance", $sympath = "C:\\build\\Dumps\\$beta\\WinTrek"  if ($core =~ /alleg/i);
			$obj = "AllSrv", $sympath = "C:\\build\\Dumps\\$beta\\FedSrv"  if ($core =~ /allsrv/i);	
			$obj = "AllSrvUI",$sympath = "C:\\build\\Dumps\\$beta\\AllSrvUI"  if ($core =~ /allsrvui/i);		
			$obj = "AGC",$sympath = "C:\\build\\Dumps\\$beta\\AGC"  if ($core =~ /agc/i);			
			$obj = "Reloader",$sympath = "C:\\build\\Dumps\\$beta\\Reloader"  if ($core =~ /reloader/i);				
			$obj = "AutoUpdate",$sympath = "C:\\build\\Dumps\\$beta\\AutoUpdate"  if ($core =~ /autoupdate/i);					
			$obj = "AllLobby",$sympath = "C:\\build\\Dumps\\$beta\\Lobby"  if ($core =~ /alllobby/i);			
			$sympath .= "\\$build";
		}
	}
	print "</pre>" if !$query->param("Submit");
	
	
	#BEGIN CRAZY MAGIC so double check we're not already performing
	if (-e "$upload_dir\\dumper.pid") { 
		open(PID,"$upload_dir\\dumper.pid");
		my $pid = <PID>;
		close PID; 	
		if ($pid != $$) {
			if ($query->param("Submit")) {
				print "This is an exclusive mode handler and it's already in use, please try again in a few seconds.<br><br><small>If this error persists, please inform imagotrigger\@gmail.com that <i>'something wierd happened with the dump checker'</i></small>";
			} else {
				print "BUSY";
			}
			exit 0;
		} else {
			unlink "$upload_dir\\dumper.pid";
		}
	}
	open(PID,">$upload_dir\\dumper.pid");
	print PID $$;
	close PID; 

	if (-e "$sympath")  {
		print "Using cached symbols at $sympath\n" if $query->param("Submit");
		$obj .= ($obj ne 'AGC') ? '.exe' : '.dll';
	} else {
		print "Congratulations, you've uploaded the first crash for build $build 1.$beta!  This will take a moment longer...\n" if $query->param("Submit");
		print "Setting up $sympath takes about 15 seconds\n" if $query->param("Submit");
		my $cmd = GetInstaller($build, $beta) . ' /S /D';
		print "executing $cmd\n";
		`$cmd`;
		sleep(1);
		$cmd = GetPDB($build, $beta);
		print "executing $cmd\n";
		`$cmd`;
		sleep(1);		
		mkdir "$sympath";
		if ($obj ne 'AGC') {
			copy("C:\\build\\Dumps\\temp\\$obj.exe",$sympath);
			copy("C:\\build\\Dumps\\temp\\$obj.pdb",$sympath);
			$obj .= '.exe';
		} else {
			copy("C:\\build\\Dumps\\temp\\$obj.dll",$sympath);
			copy("C:\\build\\Dumps\\temp\\$obj.pdb",$sympath);			
			$obj .= '.dll';
		}
		if ($obj =~ /AllSrv/i) {
			copy("C:\\build\\Dumps\\temp\\AGC.dll",$sympath);
			copy("C:\\build\\Dumps\\temp\\AGC.pdb",$sympath);			
		}
	}
	open(CFG,">C:\\Program Files (x86)\\DebugDiag\\config.xml");
	print CFG qq{<DebugDiag SymbolPath="srv*c:\\symcache*http://msdl.microsoft.com/download/symbols;$sympath" DebugSymbolPath="" ReportPath="C:\\Inetpub\\wwwroot\\build\\Dumps\\Reports" ManualUserdumpFolder="C:\\Program Files (x86)\\DebugDiag\\Logs\\Misc" UseDataStartPath="TRUE" DontShowWizard="TRUE" SourceInfoEnabled="TRUE" ScriptDebuggingEnabled="FALSE" RawLogging="FALSE" PromptForControlScript="FALSE" SaveRelativeReports="TRUE" IgnoreMcAfee="FALSE" FastTrack="FALSE" DataStartPath="" LastIncrementalCabTime="2000/1/1 12:0:0"><Rules/></DebugDiag>};
	close CFG;	
	Spawn("C:\\Program Files (x86)\\DebugDiag\\DebugDiag.exe","DebugDiag $upload_dir\\$core","$upload_dir");
	WaitWindow("Debug Diagnostic Tool",120);
	my @windows = FindWindowLike(0, "Debug Diagnostic Tool", "Afx:01000000:0");
        PushChildButton($windows[0],"&Start Analysis");
	WaitWindow("mhtml:file",120);
	my $cmd = "TASKKILL /F /IM IEXPLORE.EXE";
	`$cmd`;
	$cmd = "TASKKILL /F /IM DEBUGDIAG.EXE";
	`$cmd`;
	my @dmps = glob "$upload_dir\\Reports\\CrashHang_Report__${obj}__*.mht";
	my @last = sort @dmps;
	my $theone = scalar @last - 1;
	my $nothtml = $last[$theone];
	print "Parsing $nothtml\n" if $query->param("Submit");
	my $bin = "gurgle.crap";
	if ($nothtml  =~ /.*\\([^\\]+$)/) {
		$bin = $1;
	}		
	open(NHTML,$nothtml) or die "$!\n";
	open(HTML,">$nothtml.html");
	my $file_contents = do { local $/; <NHTML> };
	close NHTML;
	my $parsed = Email::MIME->new($file_contents );
	print "</pre>" if $query->param("Submit");
	print "<center><h1><u><a href=http://build.alleg.net/Dumps/Reports/$bin.html>Free Allegiance Dev Zone Automated Analysis</a></u></h1></center>";
	$parsed->walk_parts(sub {
	my ($part) = @_;
	return if $part->parts > 1; # multipart
	if ( $part->content_type =~ m[text/html] ) {
	  my $body = $part->body;
	  $body =~ s/<link [^>]+>//;
	  $body =~ s/\<tr\>\<td class\=mycustomText align\=center valign\=middle nowrap\>\<img border\=0 src\=res\/information\.png width\=16 height\=16\>\&nbsp\; Information\<\/td\>\<td class\=mycustomText\>DebugDiag determined that this dump file \(.*\) is a crash dump and did not perform any hang analysis\. If you wish to enable \<b\>combined crash and hang analysis\<\/b\> for crash dumps\, edit the CrashHangAnalysis\.asp script \(located in the DebugDiag\\Scripts folder\) and set the \<b\>g_DoCombinedAnalysis\<\/b\> constant to \<font color\=\'Red\'\>\<b\>True\<\/b\>\<\/font\>\.\<\/td\>\<td class\=mycustomText\>\&nbsp\;\<\/td\>\<\/tr\>//;
	  $body =~ s/\<table cellpadding\=5 cellspacing=0 class=myCustomText\>\<tr\>\<td\>\<img src\=\'res\/information\.png\'\>\<\/td\>\<td\>\<font color\=\'red\'\>Your browser settings are currently prohibiting this report's scripts from running\.\<\/font\>\<br\> This is preventing some features of this analysis report from displaying properly\. To enable scripts to run\, right\-click the security warning above and choose \"Allow Blocked Content\.\.\.\" or enable the \"Allow active content to run in files on My Computer\*\" setting on the Advanced tab of your \"Internet Options\" dialog to avoid being prompted in the future\<\/td\>\<\/tr\>\<\/table\>//;
	  $body =~ s/\<a onclick\=\'javascript\:doToggle\(\)\;return false\;\' id\=\'Dump.*\:.*\-t\' class=\'ToggleStartExpanded\' style\=\'cursor\:hand\; \'\>\<IMG class\=\'ToggleStartExpanded\' align\=\'bottom'\ src\=\'res\/up\.png\' id\=\'Dump.*\:.*\-i\'\> Report for .*\<\/a\>\<\/b\>\<br\>//;
	  $body =~ s/src\=res/src\=http\:\/\/alleg\.builtbygiants.net\/Corechecker\/res/g;
	  $part->body_set( $body );
	  
	  print $body;
	  print HTML "<html><head><title>Free Allegiance Dev Zone Automated Analysis</title><link rel=STYLESHEET type=text/css href=http://build.alleg.net/CoreChecker/res/default.css title=default></head><body>";
	  print HTML $body;
	  print HTML "</body></html>";
	}
	});	
	
	print "<pre>" if $query->param("Submit");
	close HTML;
	print "\t<a href=../Dumps/Reports/$bin>http://build.alleg.net/Dumps/Reports/$bin</a>\n" if $query->param("Submit");
	print "</pre>" if $query->param("Submit");
	
	if($build) {
		my $msg = MIME::Lite->new(
			From    => "noreply\@build.alleg.net", #this should be build.alleg.net!
			To      => "dumps\@freeallegiance.org",
			CC	=> "bard.trac\@gmail.com",
			BCc      => "alleg\@matchfire.net,jbansk\@live.com,henrik\@heimbuerger.de,lukekneller\@hotmail.com,imagotrigger\@gmail.com,comptut5\@yahoo.com,pvandommelen\@gmail.com,timjoiner\@gmail.com,badpazzword\@gmail.com,trac\@alleg.egretfiles.com,replic8tor\@gmail.com,madpeople.5k\@googlemail.com,fao.notjarvis\@googlemail.com",
			Subject => "$obj Dump b$build",
			Type    => 'multipart/mixed'
		);

		$msg->attach(
			Type     => 'TEXT',
			Data     => $query->user_agent() ." posted from ".$query->remote_host()." the attached dump report.\nhttp://build.alleg.net/Dumps/Reports/$bin.html"
		);
		$msg->attach(
			Type     => 'text/html',
			Path     => "$upload_dir\\Reports\\$bin.html",
			Filename => "$core.html",
			Disposition => 'attachment'
		);
		$msg->send('smtp','10.0.0.5');	
	}
}


print qq{
   <p>Thanks for using the online dump checker!</p>  
 </body>  
</html>  
} if $query->param("Submit");

unlink "$upload_dir\\dumper.pid";

exit 0;


 sub ErrorReport{
        print Win32::FormatMessage( Win32::GetLastError() );
    }
    
sub Spawn {
    my ($full,$args,$work,$wait) = @_;
	my $ProcessObj ; my $exitcode;
	    my $wut = Win32::Process::Create($ProcessObj,
					$full,
					$args,
					0,
					NORMAL_PRIORITY_CLASS,
					$work) || die ErrorReport();
}

sub GetInstaller {
	my $dir = "C:\\Inetpub\\wwwroot\\build";
	my ($build,$beta) = @_;
	my $glob = ($beta) ? "$dir\\R6_b$build*" : "$dir\\Alleg_b$build*";
	my @builds = glob $glob;
	return $builds[0];
}

sub GetPDB {
	my $dir = "C:\\Inetpub\\wwwroot\\build";
	my ($build,$beta) = @_;
	my $glob = ($beta) ? "$dir\\AllegR6PDB_b$build*" : "$dir\\AllegPDB_b$build*";
	my @builds = glob $glob;
	my $pdb = $builds[0];
	return "\"C:\\Program Files\\7-Zip\\7z.exe\" x -y -oC:\\build\\Dumps\\temp $pdb";
}