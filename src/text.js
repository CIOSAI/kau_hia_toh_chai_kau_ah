function createText(content, size=96) {
  let text = document.createElement('div');
  text.style.fontFamily = 'sans-serif';
  text.style.fontWeight = '900';
  text.style.textAlign = 'center';
  text.style.fontSize = `${size}px`;
  text.textContent = content;
  return text;
}

function addToRack(element) {
  document.getElementById('rack').appendChild(element);
}

export {createText, addToRack}
