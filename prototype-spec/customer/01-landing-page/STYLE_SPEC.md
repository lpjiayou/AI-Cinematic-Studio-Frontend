# Landing Page Style Specification

Version:

ACS UI Prototype V1.0


# Design System

Landing Page MUST use:

ACS Design Tokens

Source:

/design-system/tokens


No raw colors allowed.

Forbidden:

background:#xxxxxx

color:#xxxxxx


Use:

var(--acs-bg)

var(--acs-surface)

var(--acs-primary)

var(--acs-text-primary)


---

# Theme


## Dark Mode


Purpose:

Cinema atmosphere

Position:

Default Hero Experience


Use:


Background:

--acs-bg


Surface:

--acs-surface


Primary:

--acs-primary


Text:

--acs-text-primary



---


## Light Mode


Purpose:

Enterprise presentation


Use:


Background:

--acs-bg


Surface:

--acs-surface


Border:

--acs-border


Text:

--acs-text-primary



---

# Typography


Font Family:


Inter,

"Noto Sans SC",

system-ui,

sans-serif



---

## Hero Title


Size:

72px


Weight:

700


Line Height:

1.1


Usage:

Main brand statement



---


## Section Title


Size:

40px


Weight:

600



---


## Component Title


Size:

20px


Weight:

600



---


## Body


Size:

18px


Weight:

400



---


## Caption


Size:

14px


Weight:

400



---

# Spacing System


Use:

ACS spacing tokens


Base Unit:

4px



Common:


Hero Padding:

80px


Section Gap:

64px


Card Gap:

24px


Component Gap:

16px



---

# Radius


Hero Container:

32px


Card:

20px


Button:

12px


Input:

12px



---

# Motion


Hover:

240ms


Page Transition:

320ms



Allowed:


- Fade

- TranslateY

- Soft Glow



Forbidden:


- excessive animation

- gaming effects

- particle effects

- distracting motion



---

# Visual Rules


## Allowed


AI Glow


Cinema Preview Light


Soft Gradient


Glass Effect


Only for:


- Hero Preview

- AI Candidate

- Primary CTA



---


## Forbidden


Dashboard style


Data tables


Technical monitoring


GPU information


Job Queue


Hash / Ref display


Heavy shadows


Dense cards



---

# Product Feeling


The page should feel:


Apple:

clarity


Figma:

simplicity


Runway:

AI creativity


Adobe:

professional creation



Not:


Admin Console
