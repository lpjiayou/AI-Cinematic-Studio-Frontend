# Landing Page Component Mapping


## Header


Component:

ACSHeader


Source:

components/acs


Props:


logo

navigation

themeToggle

actions


---


## Hero


Component:

HeroSection


Contains:


BrandTitle

Description

CTAButtons

CinemaPreview



---


## CinemaPreview


Component:

CinemaPreview


Props:


image

status

progress


Example:


{
status:
"AI Director Generating",

progress:
68
}


---


## Pipeline


Component:

ProductionPipeline


Items:


PipelineStep[]


Example:


[
"AI Director",
"Story World",
"Character",
"Script",
"Shot",
"Delivery"
]


---


## Feature Card


Component:

ACSCard


Variant:

Feature


---


## Work Card


Component:

ACSCard


Variant:

Media


---


## CTA


Component:

ACSButton


Variant:

Primary