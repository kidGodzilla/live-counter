# Live Counter
A live JPEG or [MJPEG](https://en.wikipedia.org/wiki/Motion_JPEG) hit counter that you can embed in your website.

## Demo

View a live demo at: https://hitcounter.mr365.co/

Alternate demo: http://hit.serv.rs/

![Counter](https://hitcounter.mr365.co/static/1)

## How it Works

1. Each request serves an image that displays the number of requests made to that specific image.
2. You can choose either a `live` or `static` image. The `live` image is served as `mjpeg`, a format which can be updated continuously after the page load is complete.
3. The image can be customized by changing the default font, and colors.

## Installation

You can install the source for this server by downloading this repository, and running `npm install`.

## Usage

Each instance of the counter you embed on a website should have a unique ID. It can be anything (up to 20 characters) -- we don't pick that for you. It could be something programmatic like `md5(location.hostname)` a GUID, numeral Id (`12345`), or any other url-safe string you like (like `foo%20bar`).

```html
<img src="http://localhost:5000/live/12345" height="40" />
```

## Customization

You can customize the widget by passing parameters, like:

```html
<img src="http://localhost:5000/live/12345?font=Futura&color=black&bg=white" height="40" />
```

## Embedding a static image

If you don't want to use a live image, you can use a static one, like:

```html
<img src="http://localhost:5000/static/12345" height="40" />
```

---

Inspired by these blog posts: 

https://underjord.io/live-server-push-without-js.html 

[[Discuss on HN]](https://news.ycombinator.com/item?id=24613610)

--

https://joshwcomeau.com/react/serverless-hit-counter/ 

[[Discuss on HN]](https://news.ycombinator.com/item?id=24617086)

