#!/usr/bin/perl

#Imago <imagotrigger@gmail.com> 9/10
# Draws the game options using the in-game base image

use strict;
use CGI;
use CGI::Carp qw(fatalsToBrowser); 
use GD::Simple;

my $dir = "/home/imago/public_html";

my $q = new CGI;
my %Vars = $q->Vars;

my $img = GD::Simple->new(GD::Image->newFromPng("$dir/bases/go.png"));
my $cm = GD::Image->newFromPng("$dir/bases/cm.png");
my $mapb = GD::Image->newFromPng("$dir/bases/map_back.png");

$img->font("$dir/fonts/tahoma.ttf") or die $!;
$img->fontsize(8);
$img->fgcolor('white');

# deal /w maps
my $maps_subdir = ($Vars{MS} eq "Large" || $Vars{MS} == 1) ? 'large/' : '';
my $map_path = "$dir/maps/$maps_subdir".$Vars{MID}.' '.$Vars{NT}.'.png';
if (-e $map_path) {
	my $map = GD::Image->newFromPng($map_path);
	$img->copy($map,420,7,0,0,120,96);
} else {
	$img->moveTo(425,60);
	$img->string("No preview available");
}

$img->moveTo(108,63);
$img->string($Vars{NT});  # 2..6

$img->moveTo(108,103);
$img->string($Vars{PT});  # "1 - 6", "4 - 8", "5 - 10", "7 - 15", "10 - 20", "15 - 25", "20 - 30", "25 - 40", "35 - 50", "45 - 60", "55 - 70", "65 - 80", "75 - 90", "85 - 100"

$img->moveTo(108,143);
$img->string($Vars{SL});  # "Nov. Only", "Adv. Only", "No Nov.", "No Adv.", "Any"

$img->moveTo(108,183);
$img->string($Vars{TL});  # "Unlimited", "1", "2", "3", "4", "5", "10"

$img->moveTo(108,223);
$img->string($Vars{SM});  # "Low 0.75", "Med 1.0", "High 1.25", "V. High 1.5",  "Rib 1.65", "Sol 1.75", "Outrageous 9"

$img->moveTo(108,263);
$img->string($Vars{TM});  # "Low 0.75", "Med Low 0.85", "Med 1.0", "Med High 1.15", "High 1.25", "Higher 1.35", "Highest 1.5", "BigGame 2.5"

$img->moveTo(108,303);
$img->string($Vars{R});   # "Very Scarce", "Scarce", "Scarce+", "Normal", "N:NoHomeS", "Equal", "Plentiful", "P:NoHomeS"

$img->moveTo(108,343); 	
$img->string($Vars{T});	  # "None","Normal","High"

$img->moveTo(108,383);
$img->string($Vars{MC});  # "Low", "Medium", "High"

$img->moveTo(108,423);
$img->string($Vars{A});   # "Low", "Normal", "High"

$img->moveTo(300,63);
$img->string($Vars{MTI}); # "1", "2", "AllegSkill", "Weighted", "Simple", "N/A"

$img->moveTo(484,143);
$img->string($Vars{MT});  # "Single Ring", "Double Ring", "Pinwheel", "Diamond Ring", "Snowflake", "Split Bases", "Brawl", "Big Ring", "HiLo", "HiHigher", "Star", "InsideOut", "Grid", "EastWest", "LargeSplit"

$img->moveTo(484,183);
$img->string($Vars{MS});  # "Small","Large"

$img->moveTo(484,383);
$img->string($Vars{IM});  # "0","1","2","3","4","5","6","7","8","9","10"

$img->moveTo(484,423);
$img->string($Vars{MM});  # "0","1","2","3","4","5","6","7","8","9","10"

$img->copy($cm,359,86,0,0,14,14) if ($Vars{AD});
$img->copy($cm,359,126,0,0,14,14) if ($Vars{AJ});
$img->copy($cm,359,166,0,0,14,14) if ($Vars{SG});
$img->copy($cm,359,206,0,0,14,14) if ($Vars{EP});
$img->copy($cm,359,246,0,0,14,14) if ($Vars{FF});
$img->copy($cm,359,286,0,0,14,14) if ($Vars{IS});
$img->copy($cm,359,326,0,0,14,14) if ($Vars{D});
$img->copy($cm,359,366,0,0,14,14) if ($Vars{RM});
$img->copy($cm,359,406,0,0,14,14) if ($Vars{AR});

$img->copy($cm,527,206,0,0,14,14) if ($Vars{AT});
$img->copy($cm,527,246,0,0,14,14) if ($Vars{AE});
$img->copy($cm,527,286,0,0,14,14) if ($Vars{AS});
$img->copy($cm,527,326,0,0,14,14) if ($Vars{ASY});

my $magenta = $img->colorClosest(255,0,252);
$img->transparent($magenta);

print $q->header('image/png') .$img->png;
exit 0;