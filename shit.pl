use strict;

my $globdir = 'E:/FAZR6/objs10/FZDebug/WinTrek/*.bmp';

foreach (glob $globdir) {
	my $name = $_;
	$name =~ s/4/5/;
	rename $_,$name;
}