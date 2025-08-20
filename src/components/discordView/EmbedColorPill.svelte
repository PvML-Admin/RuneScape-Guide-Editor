<script>
  export let color
  let computed

  $: if (color) {
    const c = extractRGB(color)
    computed = `rgba(${c.r},${c.g},${c.b},1)`
  } else {
    computed = ''
  }

  function extractRGB(i) {
    return {
      r: (i >> 16) & 0xff,
      g: (i >> 8) & 0xff,
      b: i & 0xff
    }
  }
</script>

<div class="embed-color-pill" style="background-color: {computed}" />
