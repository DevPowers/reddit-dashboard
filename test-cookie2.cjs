async function test() {
  const res = await fetch('https://www.reddit.com/explore/most_visited/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      'Cookie': 'reddit_session=INVALID_TEST_COOKIE'
    }
  });
  const html = await res.text();
  console.log(html.substring(0, 1000));
}
test();
