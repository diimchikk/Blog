function fetchPosts(category = ""){
    const url = category ? `/posts?category=${encodeURIComponent(category)}` : '/posts';
    fetch(url)
    .then((response) => response.json())
    .then((posts) => {
        console.log(posts);
        const  postContainer = document.getElementById('posts');
        postContainer.innerHTML = posts
        .map(
            (post) =>`
            <div class="post ${post.category}">
            ${
                post.image
                ? `<img class="post-img" src="${post.image}" alt="${post.title}">`
                :""
            }
            <h3 class="post-category">${post.category}</h3>
            <a href = "/post-details/${encodeURIComponent(
                post.title.trim().replace(/\s+/g, "-").toLowerCase()
            )}">
            <h2 class = "post-title">${post.title}</h2>
            </a>
            <div class = "post-desc">${post.content}</div>
            <a href = "/post-details/${encodeURIComponent(
                post.title.trim().replace(/\s+/g, "-").toLowerCase()
            )}" class = "read-more"> Read More</a>
            </div>
           `
        )
        .join("");
    })
    .catch((error) => {
        console.error("Error fetching posts:", error)
        const postContainer = document.getElementById('posts');
        postContainer.innerHTML = "<p>Error Fetching posts.</p>";
    });
}

