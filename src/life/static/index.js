const toggle = document.querySelector('.toggle')
const timestamp = document.getElementById('build-timestamp')

document.addEventListener('click', (event) => {
  const actionButton = event.target.closest(`[data-action]`)

  if (actionButton) {
    actionButton.closest('article').classList.toggle('expanded')
  }
})

timestamp.innerText = new Date(
  timestamp.getAttribute('datetime')
).toLocaleString()

toggle.addEventListener('click', (e) => {
  const html = document.querySelector('html')
  if(html.classList.contains('dark')) {
      html.classList.remove('dark')
      e.target.innerHTML = 'Dark mode'
  } else {
      html.classList.add('dark')
      e.target.innerHTML = 'Light mode'
  }
})
