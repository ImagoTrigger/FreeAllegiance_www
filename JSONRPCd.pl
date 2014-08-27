#Imago <imagotrigger@gmail.com>
# A stand alone JSON-RPC Server

use common::sense;
use DBI;
use AnyEvent;
use AnyEvent::JSONRPC::Lite::Server;

my $dir = "C:/Inetpub/wwwroot/build/AllegSkill";

our $snow = time;
my $c = AnyEvent->condvar;

#Setup the handler / callbacks
our $srv = AnyEvent::JSONRPC::Lite::Server->new( port => 4502 );
$srv->reg_cb(echo => sub { my ($res_cv, @params) = @_; $res_cv->result(@params); });
$srv->reg_cb(Idle => sub { my ($res_cv, @params) = @_; $res_cv->result(DoIdle(@params)); });
$srv->reg_cb(Pump => sub { my ($res_cv, @params) = @_; $res_cv->result(DoPump(@params)); });

#setup the databases
my $dbefile = "$dir/events.db";
my $dbsfile = "$dir/stats.db";
our $dbeh	 = DBI->connect("dbi:SQLite:dbname=$dbefile","","") or die $!;
our $dbsh 	 = DBI->connect("dbi:SQLite:dbname=$dbsfile","","") or die $!;

#events
our $selenew 	= $dbeh->prepare(q{SELECT * FROM EventResults WHERE eid >= ?}) or die $!;

#stats
#NYI

#Do callbacks
$c->wait;

#Done
$selenew->finish;
$dbeh->disconnect;
exit 0; #Ok!


### Response methods
##

# Waits a minute (or so) for something to happen
sub DoIdle {
	my $eid = shift;
	$selenew->execute($eid) or die $!;
	my @response = ();
	while (my $h = $selenew->fetchrow_hashref) {push(@response,$h);}
	if (scalar @response == 1) {
		my $iter = 0;
		do {
			print ".";
			sleep(15);
			$selenew->execute($eid) or die $!;
			@response = ();
			$iter++;
			while (my $h = $selenew->fetchrow_hashref) {push(@response,$h);}
		} while(scalar @response == 1 && $iter < 5);
		print "\n";
	}
	
	return \@response;
}

# Waits 15 seconds (or less) for something to happen NYI
sub DoPump 	{return 'NYI';}

__END__