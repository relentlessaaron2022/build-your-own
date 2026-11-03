# Style Lock: Relentless Elders Collection

Every image in all 30 books shares one look. These are the blocks the prompt builder (`tools/build_prompts.py`) adds to every prompt. If you change them here, also change them in `build_prompts.py` (the `STYLE_COLOR` / `STYLE_LINEART` constants) and rebuild the prompts.

## The look (color, for the clipart bundle and the story book)

> Whimsical storybook caricature illustration, hand-painted watercolor and gouache texture with soft colored-pencil outlines. Oversized heads, big expressive eyes, exaggerated round noses, small hands and feet, warm and gentle humor. Muted earthy palette: mustard yellow, deep teal, olive green, rust orange, warm cream, cocoa brown. Full body, centered, standing on nothing. Isolated on a fully transparent background, no ground shadow, no scenery, no border, no text unless the prompt asks for it. Respectful and dignified, never mocking: these elders are loved.

## The look (line art, for the coloring book)

> Convert this exact illustration into a clean coloring-book page. Same character, same pose, same clothing details, same proportions. Pure black outlines on pure white, uniform medium-thick strokes, closed shapes that are easy to color, no shading, no gray, no hatching, no color, no background. Keep the facial expression and the patterns on fabric as simple outlines.

Line art is made **from the color image** (OpenAI image edit) so each coloring page matches its clipart exactly. If you write a line-art prompt from scratch, the character can come out different.

## Consistency rules

1. **Reference sheets first.** Run `python tools/generate_images.py --refs` once. It makes a front-facing sheet of each of the 16 cast members in `style/refs/`. Every image after that is generated as an *edit* that uses the right reference sheet(s), so Miss Mavis looks like Miss Mavis in book 1 and book 10.
2. **Never paraphrase a cast description.** The `lock` text in `cast.json` is pasted into prompts word for word.
3. **Palette stays fixed.** Themes change the props and actions. The colors and the hand stay the same.
4. **Text inside images** is used only for the Word Art / sign images, and the exact words are given in quotes. Check spelling on every one before it goes into a book.

## Originality

The sample bundle the client shared was a mood reference for the *genre* (soft caricature, earthy watercolor, elders in layered vintage clothes). Our cast, names, wardrobe and compositions are our own. Do not upload a competitor's image as a reference, and do not put any artist's name in a prompt.
