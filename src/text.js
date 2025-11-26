function createText(content, size=9) {
  let text = document.createElement('div');
  text.style.fontFamily = 'sans-serif';
  text.style.fontWeight = '900';
  text.style.textAlign = 'center';
  text.style.fontSize = `${size}vh`;
  text.textContent = content;
  return text;
}

function addToRack(element) {
  document.getElementById('rack').appendChild(element);
}

export {createText, addToRack}
