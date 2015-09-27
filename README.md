# paged-http-stream

Turn a paged http request into a stream of pages. Focuses on simplicity and modularity. Doesn't try to assume anything. You must implement a 'next' function that returns the next request based upon the previous one.

```
npm install paged-http-stream
```

## API

### `var pages = pager(opts, next)`

Options:

`method`: defaults to GET

`uri`: the url to query. includes query string.

... and anything else that can be passed to a typical node.js http request (uses [got](http://npmjs.org/got))

### `next = function (data)`

You need to implement the `next` function, which be able to interpret the data from the previous request, passed in as an argument, into a new request.

## Example

For example, [figshare](http://figshare.com) returns each of their search pages like this:
```json
{
  "items_found" : 91,
  "page_nr": 1,
  "items": []
}
```

So, I can write a function `next` that takes the `page_nr` and adds one, and then returns `null` when the items list is empty:
```js
function next (data) {
  // data will be JSON parsed already.
  if (data.error) throw new Error(data.error)
  if (data.items && data.items.length === 0) return null // we are done here
  var query = {
    search_for: 'this is my query',
    page: parseInt(data.page_nr + 1) || 1 // get the next page
  }
  return getOpts(query)
}

function getOpts (query) {
  return {
    method: 'GET',
    uri: 'http://api.figshare.com/v1/articles/search?' + qs.stringify(query)
  }
}
```

Then, pass to the pager:
```js
var pageStream = pager(startingOpts, next)
```

You can then get access to each page like this (as JSON):
```js
pageStream.on('data', funciton (page) {
  console.log(page.items)
})
```

## As seen in

[figshare-search](http://github.com/karissa/figshare-search)

## TODO

* timeout, or wait time between requests
