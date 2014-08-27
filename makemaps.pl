#Imago <imagotrigger@gmail.com>
# Renames bitmaps dumped from Allegiance using file creation time and the order from maplist below.
# This is normally run 6 times once for each Number of Teams #.

use File::Basename;
use File::stat;

my $globdir = 'E:/FAZR6/objs10/FZDebug/WinTrek/*.bmp';
my $teams = $ARGV[0] or die "You must supply the number of teams!";

my @maplist = (
	{0 => 'Single Ring'},
	{1 => 'Double Ring'},
	{2 => 'Pinwheel'},
	{3 => 'Diamond Ring'},
	{4 => 'Snowflake'},
	{5 => 'Split Bases'},
	{6 => 'Brawl'},
	{7 => 'Big Ring'},
	{8 => 'HiLo'},
	{9 => 'HiHigher'},
	{10 => 'Star'},
	{11 => 'InsideOut'},
	{12 => 'Grid'},
	{13 => 'EastWest'},
	{14 => 'LargeSplit'}
);


my $cnt = 0;
foreach (sort {stat($a)->ctime <=> stat($b)->ctime} glob($globdir)) {
	my ($name,$path,$suffix) = fileparse($_,('.bmp'));
	my $ref = $maplist[$cnt];
	my @keys = keys %$ref;
	my $key = $keys[0];
	my $value = $ref->{$key}; #unused (just for verifying)
	print "Renaming $name to $key as $value\n";
	
	rename $_ , $path.'/'.$key." $teams.bmp";
	
	$cnt++;
}

__END__

	{m2xiblimited =>'Limited'},
	{m2xibpolishe =>'Polished'},
	{m2xibblender =>'Blender'},
	{m2xibiron =>'Iron'},
	{m2xibsilver =>'Silver'},
	{m2xibradon =>'Radon'},
	{m2xibxenon =>'Xenon'},
	{m2xibjasper =>'Jasper'},
	{m2xibtopaz =>'Topaz'},
	{m2xibruby =>'Ruby'},
	{m2xibgarnet =>'Garnet'},
	{m2xibsapphir =>'Sapphire'},
	{m2xibsun =>'Sunstone'},
	{m2xibnova =>'Nova'},
	{m2xibjade =>'Jade'},
	{m2xibquart =>'Quartz'},
	{m2xibcobalt =>'Cobalt'},
	{m2xibcopper =>'Copper'},
	{m2xibboron =>'Boron'},
	{m2xibdollar =>'Dollar'},
	{m2xibgran =>'Granite'},
	{m2xibsodium =>'Sodium'},
	{m2xibcarbon =>'Carbon'},
	{m2xibzinc =>'Zinc'},
	{m2xibtin =>'Tin'},
	{m2xiblead =>'Lead'},
	{m2xibvinci =>'Da Vinci'},
	{m2xibawe =>'Awesome'},