#!/usr/bin/perl

#Imago <imagotrigger@gmail.com> 9/10
# Draws the win conditions using the in-game base image

use strict;
use CGI;
use CGI::Carp qw(fatalsToBrowser); 
use GD::Simple;

my $dir = "/home/imago/public_html";

my $q = new CGI;
my %Vars = $q->Vars;
 
my $img = GD::Simple->new(GD::Image->newFromPng("$dir/bases/wc.png"));
$img->font("$dir/fonts/tahoma.ttf") or die $!;
$img->fontsize(8);
$img->fgcolor('white');

$img->moveTo(90,68);
$img->string($Vars{GT}); #Conquest, Custom, Experimental, Territorial, Artifacts, Capure the Flag, Death Match

$img->moveTo(90,118);
$img->string($Vars{C}); # N/A, 80%, 90%, 100%

$img->moveTo(90,170);
$img->string($Vars{T}); # N/A, 80%, 90%

$img->moveTo(90,220);
$img->string($Vars{P}); # N/A, Low, Medium, High

$img->moveTo(90,270);               
$img->string($Vars{A}); # N/A, 5, 10, 25

$img->moveTo(90,320);               
$img->string($Vars{F});	# N/A, 5, 10, 25

$img->moveTo(90,370);
$img->string($Vars{R}); # N/A, 5, 10, 20..100 

$img->moveTo(90,420);
$img->string($Vars{D});  # N/A, 10 min., 20 min., 30 min., 1 hour, 2 hours...6 hours

print $q->header('image/png') .$img->png;
exit 0;
