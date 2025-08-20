<script>
  export let url

  $: urlHTML = urlToHTML(url)

  function urlToHTML(url) {
    let match

    // Check for YouTube URLs
    if (
      (match = url.match(
        /https?:\/\/(?:youtu\.be\/|(?:www\.)?youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/
      ))
    ) {
      return `<iframe class='media' width='560' height='315' src='https://www.youtube.com/embed/${match[1]}' frameborder='0' allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture' allowfullscreen></iframe>`
    }

    // Check for image URLs (common image file extensions)
    if (url.match(/\.(jpg|jpeg|png|gif|webp|bmp)(\?.*)?$/i)) {
      return `<img class='media max-w-full h-auto' src='${url}' alt='Embedded image' loading='lazy' />`
    }

    // If it's not YouTube or an image, return error message
    return `<p class='bg-red-900 p-2 my-2' style='color: hsla(0, 0%, 100%, .7)'>Can't embed <a href='${url}'>${url}</a></p>`
  }
</script>

{@html urlHTML}
