use strict;
use CGI qw(:standard -nph);
use CGI::Carp qw ( fatalsToBrowser );  
use DBI;
use DBD::SQLite;
use LWP::UserAgent;
 use Convert::Binary::C::Cached;
  
use Data::Dumper;

$| = 1;
my $query = new CGI;  
my $name = $query->param("Callsign");  
my $names = $query->param("Callsigns");  
if ($name =~ /(.*)\(/) {
	$name  = $1;
}
if ($query->user_agent() !~ /mbedthis-client/ || length($name) > 12) {
	print $query->header ();  
	print "OK";
	exit 0;
}

my $dbfile = "C:/Inetpub/wwwroot/build/AllegSkill/balance.db";
our $dbh = DBI->connect("dbi:SQLite:dbname=$dbfile","","");
our $sel = $dbh->prepare(q{SELECT bid,mu,sigma,rank FROM balance WHERE name = ?});

if ($name) {
	my ($bid, $lmu, $lsigma, $lrank) = SelectBalanceData($name);
	if ($lmu && $lsigma) {
		print $query->header ();  
		print "$lmu $lsigma $lrank";
	} else { 
		print $query->header ();  
		my $ua = LWP::UserAgent->new;
		$ua->timeout(3);
		my $asgs = "http://asgs.alleg.net/asgs/services.asmx/GetPlayerRank?Callsign=$name";
		my $response = $ua->get($asgs);
		if ($response->content =~ /\|/) {
			print $response->content;
		}
	}
}

if ($names) {
	print $query->header ();  

	my $c = Convert::Binary::C::Cached->new(Cache   => 'C:/Inetpub/wwwroot/build/AllegSkill/msr.c',);
	$c->configure(FloatSize  => 4, UnsignedChars => 0,  Alignment => 8);
	$c->parse_file("C:/Inetpub/wwwroot/build/AllegSkill/msr.h");
	$c->tag('Msr.name', Format => 'Binary');
	$c->tag('Msr.name', Dimension => 12);
	my @names = split(' ',$names);
	my $sql = sprintf 'SELECT name,mu,sigma,rank FROM balance WHERE name IN ( %s )', join( ',', map { $dbh->quote( $_ ) } @names );
	my $sels = $dbh->prepare($sql);
	$sels->execute();
	my @data; my @rows; my $name; my $mu; my $sigma; my $rank;
	$sels->bind_columns(\$name, \$mu,\$sigma,\$rank);
	my $count = 0; my $packed;
	while ($sels->fetch) {
		$name = sprintf("%-*s", 12, $name);
		my $msrdata = { name => $name, mu => $mu, sigma => $sigma, rank=> $rank };
		$packed .= $c->pack('Msr', $msrdata);
		$count++;
	}
	 $count = sprintf("%03d", $count);
	binmode STDOUT;
	print STDOUT $count.$packed;
}

EXIT:
$sel->finish;
$dbh->disconnect;
exit 0;

sub SelectBalanceData($) {
	$sel->execute(shift);
	my @data; my $bid; my $mu; my $sigma; my $rank;
	$sel->bind_columns(\$bid, \$mu,\$sigma,\$rank);
	$sel->fetch;
	return ($bid, $mu,$sigma,$rank);
}

__END__