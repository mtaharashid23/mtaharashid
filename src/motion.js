// GSAP setup: plugins, the three eases the whole site uses, shared defaults.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
import { Flip } from 'gsap/Flip';
import { Observer } from 'gsap/Observer';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, Flip, Observer, DrawSVGPlugin);
CustomEase.create('expoOut', '0.16, 1, 0.3, 1');
CustomEase.create('quartOut', '0.25, 1, 0.5, 1');
CustomEase.create('expoInOut', '0.87, 0, 0.13, 1');
gsap.defaults({ ease: 'expoOut', duration: 1 });
ScrollTrigger.config({ ignoreMobileResize: true });

// One shared reveal preset so DOM and WebGL speak the same easing language.
export const REVEAL = { duration: 1.1, ease: 'expoOut', y: '14%', start: 'top 82%' };

export { gsap, ScrollTrigger, SplitText, Flip, Observer, DrawSVGPlugin };
