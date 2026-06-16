export const HAIRSTYLE_PROMPTS: Record<string, { prompt: string; negative: string }> = {
  "buzz-cut": {
    prompt: "A person with a very short buzzed haircut, clippershaved head, uniform length all over, clean and masculine, high resolution portrait, realistic skin texture",
    negative: "long hair, curly, wavy, bald, hat, glasses, low quality, distorted"
  },
  "low-fade": {
    prompt: "A person with a low skin fade haircut, short on sides and back fading from the bottom, longer on top, clean modern barber style, sharp lineup, high resolution portrait",
    negative: "long hair, uneven, messy, unkempt, hat, glasses, low quality"
  },
  "mid-fade": {
    prompt: "A person with a mid skin fade haircut, graduated fade starting at mid temple level, short textured top, clean modern look, high resolution portrait",
    negative: "long hair, beard遮挡, messy, unkempt, hat, low quality"
  },
  "high-fade": {
    prompt: "A person with a high skin fade haircut, fade starting high near the temples, very short sides, longer textured top, modern stylish look, high resolution portrait",
    negative: "long hair, messy, unkempt, hat, glasses, low quality"
  },
  "taper-fade": {
    prompt: "A person with a taper fade haircut, gradual fade on sides and neckline, natural looking transition, clean professional style, high resolution portrait",
    negative: "long hair, messy, uneven, hat, low quality"
  },
  "afro": {
    prompt: "A person with a full voluminous afro hairstyle, big round natural curly hair, well maintained, black hair, confident look, high resolution portrait",
    negative: "bald, straight hair, braids, dreadlocks, hat, low quality"
  },
  "twists": {
    prompt: "A person with two strand twists hairstyle, neat uniform twist patterns, medium length, natural look, well maintained, high resolution portrait",
    negative: "bald, afro, dreadlocks, straight hair, messy, low quality"
  },
  "dreadlocks": {
    prompt: "A person with dreadlocks hairstyle, long matted rope-like strands, natural locs, well maintained, stylish, high resolution portrait",
    negative: "afro, twists, straight hair, bald, messy, low quality"
  },
  "bob-cut": {
    prompt: "A person with a classic bob haircut, chin-length straight hair, clean blunt cut, elegant feminine style, symmetrical, high resolution portrait",
    negative: "long hair past shoulders, curly, messy, bangs uneven, low quality"
  },
  "pixie-cut": {
    prompt: "A person with a pixie cut hairstyle, very short feminine haircut, cropped nape, textured top, elegant and bold, high resolution portrait",
    negative: "long hair, bob, curls, messy, hat, low quality"
  },
  "curly-bob": {
    prompt: "A person with a curly bob haircut, shoulder-length curly hair, voluminous bouncy curls, modern feminine style, high resolution portrait",
    negative: "straight hair, flat, limp, messy, low quality"
  },
  "wolf-cut": {
    prompt: "A person with a wolf cut hairstyle, shaggy layered haircut, volume on top, wavy edgy ends, modern trendy, high resolution portrait",
    negative: "straight blunt cut, bob, pixie, neat, low quality"
  },
  "long-waves": {
    prompt: "A person with long wavy hair, flowing beach waves, soft natural wave pattern, voluminous and healthy, high resolution portrait",
    negative: "straight flat hair, short hair, frizzy, messy, low quality"
  },
  "bangs": {
    prompt: "A person with straight across bangs hairstyle, foreheadcovering fringe, long or medium length hair, neat bangs, high resolution portrait",
    negative: "no bangs, pulled back hair, short hair, messy, low quality"
  },
  "curly": {
    prompt: "A person with naturally curly hair, voluminous ringlets and curls, well defined curl pattern, frizzfree, high resolution portrait",
    negative: "straight hair, flat, limp, messy, low quality"
  },
  "short-natural": {
    prompt: "A person with short natural hair, closecut textured natural hairstyle, tapered sides, defined curls on top, high resolution portrait",
    negative: "long hair, afro, braids, extensions, low quality"
  },
  "braids": {
    prompt: "A person with braided hairstyle, neat cornrows or box braids, symmetrical parting, sleek and elegant, high resolution portrait",
    negative: "loose hair, afro, dreadlocks, messy, undone, low quality"
  },
  "locs": {
    prompt: "A person with locs hairstyle, long twisted ropelike strands, well maintained sisterlocks or traditional locs, neat, high resolution portrait",
    negative: "loose hair, braids, twists, messy, frizzy, low quality"
  },
  "mullet": {
    prompt: "A person with a mullet haircut, short on top and front, longer in back, retro modern style, business in front party in back, high resolution portrait",
    negative: "uniform length, bob, pixie, low quality"
  },
  "undercut": {
    prompt: "A person with an undercut hairstyle, shaved or closely cropped sides, long hair on top, dramatic contrast, modern edgy, high resolution portrait",
    negative: "uniform length, faded sides, messy, low quality"
  },
  "mohawk": {
    prompt: "A person with a mohawk hairstyle, shaved sides with a strip of longer hair in the middle from forehead to nape, bold edgy style, high resolution portrait",
    negative: "full head of hair, fade, undercut, low quality"
  },
  "french-bob": {
    prompt: "A person with a French bob haircut, jawlength blunt cut, short elegant bob, typically with bangs, Parisian chic style, high resolution portrait",
    negative: "long hair, curly, messy, low quality"
  },
  "shag": {
    prompt: "A person with a shag haircut, heavily layered haircut, lots of texture and movement, feathered ends, retro 70s inspired, high resolution portrait",
    negative: "blunt cut, straight one length, flat, low quality"
  },
  "butterfly-cut": {
    prompt: "A person with a butterfly haircut, long layered hair with faceframing pieces, voluminous and airy, whimsical feminine style, high resolution portrait",
    negative: "short hair, blunt cut, flat, low quality"
  },
  "hime-cut": {
    prompt: "A person with a hime cut hairstyle, long straight hair with short blunt fringe and side pieces, Japanese anime inspired elegant style, high resolution portrait",
    negative: "curly hair, bobs, layered, low quality"
  },
  "fade-with-design": {
    prompt: "A person with a fade haircut with a shaved line design, artistic hair tattoo on faded sides, short textured top, creative barber style, high resolution portrait",
    negative: "no design, long hair, messy, hat, low quality"
  },
  "slicked-back": {
    prompt: "A person with slicked back hair, hair pulled back smoothly with product, glossy wet look, formal elegant style, high resolution portrait",
    negative: "messy, loose hair, hat, casual, low quality"
  },
  "man-bun": {
    prompt: "A person with a man bun hairstyle, long hair pulled back into a bun at the back of the head, styled beard optional, modern masculine, high resolution portrait",
    negative: "short hair, loose hair, messy bun, low quality"
  },
  "pompadour": {
    prompt: "A person with a pompadour hairstyle, voluminous hair swept upward and back from the forehead, short sides, classic vintage style, high resolution portrait",
    negative: "flat hair, fade, undercut, messy, low quality"
  },
  "quiff": {
    prompt: "A person with a quiff hairstyle, hair styled upward and back at the front creating volume, short faded sides, modern trendy, high resolution portrait",
    negative: "flat hair, uniform length, messy, low quality"
  },
  "side-part": {
    prompt: "A person with a side part haircut, clean defined side parting, short neat hair, classic professional style, high resolution portrait",
    negative: "no part, messy, long hair, casual, low quality"
  },
  "crop-top": {
    prompt: "A person with a crop top hairstyle, short hair with textured fringe on top, cropped sides and back, modern clean style, high resolution portrait",
    negative: "long hair, fade, messy, hat, low quality"
  },
  "bowl-cut": {
    prompt: "A person with a modern bowl cut hairstyle, round uniform length all around, soft edges, Korean inspired trendy style, high resolution portrait",
    negative: "layered, messy, short sides, low quality"
  },
  "curtains": {
    prompt: "A person with curtain bangs hairstyle, hair parted in the middle with faceframing pieces on both sides, 90s inspired, high resolution portrait",
    negative: "straight across bangs, short hair, messy, low quality"
  },
  "layered-long": {
    prompt: "A person with long layered hair, cascading layers throughout, lots of movement and texture, soft feminine look, high resolution portrait",
    negative: "blunt cut, one length, short, messy, low quality"
  },
  "v-cut": {
    prompt: "A person with a Vcut hairstyle, long hair with a Vshape at the back, even layers, sleek and polished, high resolution portrait",
    negative: "blunt cut, U shape, curly, messy, low quality"
  },
  "u-cut": {
    prompt: "A person with a Ucut hairstyle, long hair with a soft Ushape at the back, uniform length, elegant simple style, high resolution portrait",
    negative: "V shape, layered, messy, low quality"
  },
  "french-braid": {
    prompt: "A person with French braids, two braids woven close to the scalp from front to back, neat and elegant, high resolution portrait",
    negative: "loose hair, messy, single braid, low quality"
  },
  "dutch-braid": {
    prompt: "A person with Dutch braids, two reverse braids standing out from the head, neat and stylish, high resolution portrait",
    negative: "loose hair, messy, French braid, low quality"
  },
  "fishtail-braid": {
    prompt: "A person with a fishtail braid, intricate woven braid resembling a fish tail, romantic bohemian style, high resolution portrait",
    negative: "simple braid, messy, loose, low quality"
  },
  "waterfall-braid": {
    prompt: "A person with a waterfall braid, cascading braid that lets hair fall through like a waterfall, elegant romantic style, high resolution portrait",
    negative: "simple braid, messy, tight, low quality"
  },
  "bubble-ponytail": {
    prompt: "A person with a bubble ponytail, high ponytail with hair sections creating bubble-like segments, fun trendy style, high resolution portrait",
    negative: "plain ponytail, messy, low quality"
  },
  "space-buns": {
    prompt: "A person with space buns hairstyle, two buns on top of the head, playful fun style, high resolution portrait",
    negative: "one bun, messy, low quality"
  },
  "half-up-half-down": {
    prompt: "A person with half up half down hairstyle, top half of hair pulled back, bottom half flowing freely, versatile elegant style, high resolution portrait",
    negative: "all up, all down, messy, low quality"
  },
  "top-knot": {
    prompt: "A person with a top knot hairstyle, hair gathered into a bun at the crown of the head, sleek or messy style, high resolution portrait",
    negative: "man bun, low bun, messy, low quality"
  },
  "low-bun": {
    prompt: "A person with a low bun hairstyle, hair gathered into a bun at the nape of the neck, elegant sophisticated style, high resolution portrait",
    negative: "high bun, messy, casual, low quality"
  },
  "messy-bun": {
    prompt: "A person with a messy bun hairstyle, loosely gathered bun with intentional loose strands, casual effortless style, high resolution portrait",
    negative: "neat bun, sleek, formal, low quality"
  },
  "sleek-ponytail": {
    prompt: "A person with a sleek high ponytail, hair pulled back tightly and smoothly, high ponytail, polished elegant style, high resolution portrait",
    negative: "messy, low ponytail, casual, low quality"
  },
  "low-ponytail": {
    prompt: "A person with a low ponytail, hair gathered at the nape of the neck, sleek and simple, professional style, high resolution portrait",
    negative: "high ponytail, messy, casual, low quality"
  },
  "side-swept": {
    prompt: "A person with side swept hair, hair swept dramatically to one side, elegant red carpet style, high resolution portrait",
    negative: "center part, symmetric, messy, low quality"
  },
  "finger-waves": {
    prompt: "A person with finger wave hairstyle, sculpted Sshaped waves close to the scalp, vintage 1920s glamorous style, high resolution portrait",
    negative: "natural curls, messy, modern, low quality"
  },
  "victory-rolls": {
    prompt: "A person with victory rolls hairstyle, pincurled rolls on top or sides of the head, retro 1940s vintage style, high resolution portrait",
    negative: "modern, flat, messy, low quality"
  },
  "beehive": {
    prompt: "A person with a beehive hairstyle, tall voluminous teased hairdo, 1960s retro style, high resolution portrait",
    negative: "flat, modern, short, low quality"
  },
  "mohawk-braid": {
    prompt: "A person with a braided mohawk, braid running from forehead to nape with shaved or faded sides, bold edgy style, high resolution portrait",
    negative: "full hair, loose, messy, low quality"
  },
  "cornrows": {
    prompt: "A person with cornrow braids, braids woven close to the scalp in straight lines, neat intricate pattern, high resolution portrait",
    negative: "loose hair, box braids, messy, low quality"
  },
  "box-braids": {
    prompt: "A person with box braids, individual squareSectioned braids hanging freely, medium to long length, protective style, high resolution portrait",
    negative: "cornrows, loose hair, messy, low quality"
  },
  "knotless-braids": {
    prompt: "A person with knotless braids, braids that start with natural hair without knots at the root, seamless natural look, high resolution portrait",
    negative: "box braids with knots, loose, messy, low quality"
  },
  "fulani-braids": {
    prompt: "A person with Fulani braids, cornrows at the front with a center part, braids flowing back, decorative beads, high resolution portrait",
    negative: "box braids, loose hair, messy, low quality"
  },
  "passion-twists": {
    prompt: "A person with passion twists hairstyle, chunky twisted rope-like strands, bohemian textured look, medium length, high resolution portrait",
    negative: "smooth braids, dreadlocks, messy, low quality"
  },
  "havana-twists": {
    prompt: "A person with Havana twists, thick chunky twist extensions, long and bold, protective style, high resolution portrait",
    negative: "thin twists, braids, messy, low quality"
  },
  "spring-twists": {
    prompt: "A person with spring twists, tightly coiled springy twist extensions, bouncy and playful, high resolution portrait",
    negative: "straight twists, braids, messy, low quality"
  },
  "faux-locs": {
    prompt: "A person with faux locs hairstyle, artificial locs that mimic real dreadlocks, protective style, bohemian look, high resolution portrait",
    negative: "real locs, braids, messy, low quality"
  },
  "distressed-locs": {
    prompt: "A person with distressed locs, intentionally roughened and textured locs, bohemian free-spirited style, high resolution portrait",
    negative: "neat perfect locs, smooth, low quality"
  },
  "bob-with-bangs": {
    prompt: "A person with a bob haircut with bangs, chin-length bob paired with straight across or wispy bangs, chic stylish look, high resolution portrait",
    negative: "no bangs, long hair, messy, low quality"
  },
  "lob": {
    prompt: "A person with a lob long bob haircut, hair falling between chin and shoulders, versatile trendy style, high resolution portrait",
    negative: "short bob, long hair, messy, low quality"
  },
  "asymmetrical-bob": {
    prompt: "A person with an asymmetrical bob haircut, shorter in the back, longer in the front, edgy modern style, high resolution portrait",
    negative: "symmetrical bob, long hair, messy, low quality"
  },
  "inverted-bob": {
    prompt: "A person with an inverted bob haircut, stacked layers in the back creating a wedge shape, longer front pieces, high resolution portrait",
    negative: "blunt bob, uniform length, messy, low quality"
  },
  "bixie": {
    prompt: "A person with a bixie haircut, hybrid of bob and pixie cut, short textured hair with faceframing layers, trendy style, high resolution portrait",
    negative: "long hair, classic bob, pixie, messy, low quality"
  },
  "mullet-women": {
    prompt: "A woman with a modern mullet haircut, short feathered top, longer ends in the back, edgy feminine style, high resolution portrait",
    negative: "uniform length, traditional, boring, low quality"
  },
  "shullet": {
    prompt: "A person with a shullet haircut, shag mullet hybrid, lots of texture and layers, voluminous top, longer back, high resolution portrait",
    negative: "blunt cut, uniform, flat, low quality"
  },
  "curly-shag": {
    prompt: "A person with a curly shag haircut, layered cut for curly hair, lots of volume and definition, bouncy ringlets, high resolution portrait",
    negative: "straight hair, flat, limp, low quality"
  },
  "wavy-shag": {
    prompt: "A person with a wavy shag haircut, layered shag cut for wavy hair, textured beachy waves, effortless style, high resolution portrait",
    negative: "straight hair, flat, limp, low quality"
  },
  "textured-bob": {
    prompt: "A person with a textured bob haircut, choppy layers in a bob length, volume and movement, modern casual style, high resolution portrait",
    negative: "blunt bob, flat, smooth, low quality"
  },
  "feathered-hair": {
    prompt: "A person with feathered hair, layered haircut with feathered ends, soft and airy, Farrah Fawcett inspired, high resolution portrait",
    negative: "blunt cut, heavy, flat, low quality"
  },
  "pageboy": {
    prompt: "A person with a pageboy haircut, smooth helmet-shaped bob with turned under ends, classic vintage style, high resolution portrait",
    negative: "layered, textured, modern, low quality"
  },
  "bob-with-highlights": {
    prompt: "A person with a bob haircut with blonde highlights, dimension and depth in a classic bob, stylish sun-kissed look, high resolution portrait",
    negative: "solid color, no highlights, messy, low quality"
  },
  "ombre-hair": {
    prompt: "A person with ombre hair, hair color fading from dark at the roots to lighter at the ends, smooth gradient, high resolution portrait",
    negative: "solid color, harsh line, messy, low quality"
  },
  "balayage": {
    prompt: "A person with balayage hair color, handpainted highlights creating a natural sun-kissed look, soft graduated color, high resolution portrait",
    negative: "foil highlights, solid color, harsh, low quality"
  },
  "hair-keratin": {
    prompt: "A person with keratin treated hair, sleek smooth shiny hair, frizzfree straight style, glossy and healthy, high resolution portrait",
    negative: "frizzy, curly, wavy, damaged, low quality"
  },
  "perm-hair": {
    prompt: "A person with permed hair, uniform curls throughout from chemical treatment, voluminous bouncy look, high resolution portrait",
    negative: "natural curls, straight, flat, low quality"
  },
  "temp-fade": {
    prompt: "A person with a temp fade haircut, distinctive shapeup with a sharp angled hairline at the temples, high resolution portrait",
    negative: "low quality, messy, hat"
  },
  "burst-fade": {
    prompt: "A person with a burst fade haircut, semicircular fade around the ear area, short textured top, unique style, high resolution portrait",
    negative: "straight fade line, messy, hat, low quality"
  },
  "drop-fade": {
    prompt: "A person with a drop fade haircut, fade that drops down behind the ear following the head shape, curved neckline, high resolution portrait",
    negative: "straight neckline, messy, hat, low quality"
  },
  "skin-fade": {
    prompt: "A person with a skin fade haircut, fade that goes down to bare skin, sharpest fade possible, clean barber style, high resolution portrait",
    negative: "long hair, no fade, messy, hat, low quality"
  },
  "ivy-league": {
    prompt: "A person with an ivy league haircut, short neat hair with a natural look, longer on top than sides, preppy style, high resolution portrait",
    negative: "long hair, messy, extreme fade, low quality"
  },
  "crew-cut": {
    prompt: "A person with a crew cut, short tapered haircut where top hair is slightly longer than fade sides, clean classic, high resolution portrait",
    negative: "long hair, messy, extreme, low quality"
  },
  "butch-cut": {
    prompt: "A person with a butch cut, uniformly short haircut all over, shorter than crew cut but longer than buzz cut, high resolution portrait",
    negative: "long hair, fade, messy, low quality"
  },
  "brush-cut": {
    prompt: "A person with a brush cut, very short haircut with hair standing upright like a brush, military style, high resolution portrait",
    negative: "long hair, messy, flat, low quality"
  },
  "flattop": {
    prompt: "A person with a flattop haircut, hair cut flat and level on top like a plateau, sharp squared corners, classic style, high resolution portrait",
    negative: "rounded top, long, messy, low quality"
  },
  "high-top-fade": {
    prompt: "A person with a high top fade haircut, tall flat top with faded sides, 90s inspired classic style, high resolution portrait",
    negative: "short top, no fade, messy, low quality"
  },
  "jheri-curl": {
    prompt: "A person with a Jheri curl, glossy wetlooking curls all over, 80s retro style, high resolution portrait",
    negative: "dry hair, matte, modern, low quality"
  },
  "finger-coils": {
    prompt: "A person with finger coils hairstyle, defined spiral coils created by twisting hair around fingers, neat pattern, high resolution portrait",
    negative: "undefined, messy, straight, low quality"
  },
  "sponge-curls": {
    prompt: "A person with sponge curl hairstyle, tight defined curls created with a sponge brush, uniform circular pattern, high resolution portrait",
    negative: "straight, undefined, messy, low quality"
  },
  "bantu-knots": {
    prompt: "A person with Bantu knots hairstyle, small coiled buns all over the head, neat symmetrical pattern, high resolution portrait",
    negative: "loose hair, messy, undone, low quality"
  },
  "flat-twists": {
    prompt: "A person with flat twist hairstyle, twists flat against the scalp in neat rows, elegant protective style, high resolution portrait",
    negative: "loose hair, messy, raised twists, low quality"
  },
  "senegalese-twists": {
    prompt: "A person with Senegalese twists, smooth sleek rope-twisted extensions, uniform thickness, long elegant style, high resolution portrait",
    negative: "rough twists, braids, messy, low quality"
  },
  "marley-twists": {
    prompt: "A person with Marley twists, thick matte-textured twisted extensions, natural bohemian look, high resolution portrait",
    negative: "smooth twists, braids, messy, low quality"
  },
  "kinky-twists": {
    prompt: "A person with kinky twists, textured twist extensions that match natural afro hair texture, protective style, high resolution portrait",
    negative: "smooth straight twists, loose, messy, low quality"
  },
  "microlocs": {
    prompt: "A person with microlocs hairstyle, very small thin locs all over, neat and uniform, delicate style, high resolution portrait",
    negative: "thick locs, loose, messy, low quality"
  },
  "sisterlocks": {
    prompt: "A person with sisterlocks, very small uniform locks created with a special patterning technique, neat style, high resolution portrait",
    negative: "thick locs, loose, messy, low quality"
  },
  "fauxhawk": {
    prompt: "A person with a fauxhawk hairstyle, illusion of a mohawk without shaving sides, raised center strip, trendy style, high resolution portrait",
    negative: "shaved sides, real mohawk, messy, low quality"
  },
  "liberty-spikes": {
    prompt: "A person with liberty spikes hairstyle, hair styled into stiff upright spikes all over, punk edgy style, high resolution portrait",
    negative: "flat, messy, conservative, low quality"
  },
  "death-hawk": {
    prompt: "A person with a deathhawk hairstyle, extreme mohawk with shaved sides and long spiked center strip, punk style, high resolution portrait",
    negative: "conservative, short, low quality"
  },
  "psychobill": {
    prompt: "A person with a psychobilly hairstyle, pompadour front with long slicked back sides and back, rockabilly style, high resolution portrait",
    negative: "neat, conservative, modern, low quality"
  },
  "wedge": {
    prompt: "A person with a wedge haircut, triangular shaped haircut with stacked layers in the back, classic short style, high resolution portrait",
    negative: "long, uniform, flat, low quality"
  },
  "pixie-bob": {
    prompt: "A person with a pixie bob haircut, hybrid between pixie and bob, short with longer faceframing pieces, high resolution portrait",
    negative: "classic bob, long pixie, messy, low quality"
  },
  "caesar-cut": {
    prompt: "A person with a Caesar cut, short horizontally fringed haircut inspired by Julius Caesar, classic clean style, high resolution portrait",
    negative: "long, fade, messy, low quality"
  },
  "french-crop": {
    prompt: "A person with a French crop haircut, short textured top with a short fringe, clean faded sides, European style, high resolution portrait",
    negative: "long hair, no fringe, messy, low quality"
  },
  "korean-perm": {
    prompt: "A person with a Korean perm hairstyle, soft voluminous perm with natural looking waves and texture, Kpop inspired style, high resolution portrait",
    negative: "tight curls, straight, flat, low quality"
  },
  "japanese-straight": {
    prompt: "A person with Japanese straight perm, perfectly pin-straight smooth hair, glossy and sleek, high resolution portrait",
    negative: "curly, wavy, frizzy, damaged, low quality"
  },
  "digital-perm": {
    prompt: "A person with a digital perm hairstyle, large soft waves created with hot rods, natural flowing movement, high resolution portrait",
    negative: "tight curls, straight, damaged, low quality"
  },
  "setting-perm": {
    prompt: "A person with a setting perm haircut, loose voluminous curls created with large rollers, soft glamorous look, high resolution portrait",
    negative: "tight curls, flat, straight, low quality"
  },
  "magic-locs": {
    prompt: "A person with magic locs hairstyle, curly faux locs with wavy textured ends, bohemian chic, high resolution portrait",
    negative: "straight locs, smooth, messy, low quality"
  },
  "goddess-braids": {
    prompt: "A person with goddess braids, large chunky cornrow braids arranged in elegant patterns, regal style, high resolution portrait",
    negative: "small braids, loose, messy, low quality"
  },
  "stitch-braids": {
    prompt: "A person with stitch braids, cornrows with visible stitching pattern, neat uniform straight lines, clean style, high resolution portrait",
    negative: "curved braids, messy, loose, low quality"
  }
};
