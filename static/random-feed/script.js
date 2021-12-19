$.getJSON("random-feed.json", function (data) {
  let randomBlog = data[Math.ceil(Math.random() * data.length) - 1]; // get each JSON object
  // console.log(Math.ceil(Math.random() * data.length));
  document.getElementById("content").innerText = randomBlog.name;
  document.getElementById("content").href = randomBlog.link;
});

$("#bt_new").click(function () {
  location.reload();
});