document.addEventListener("DOMContentLoaded", () => {
  const susto = document.getElementById('susto');
  const grito = document.getElementById('grito');
  let yaIniciado = false;

  // Bucle infinito perfecto
  grito.addEventListener('ended', () => {
    grito.currentTime = 0;
    grito.play().catch(() => {});
  });

  // Función que desata el susto
  function lanzarSusto() {
    if (yaIniciado) return;
    yaIniciado = true;

    setTimeout(() => {
      // 1. Mostrar la imagen de la niña
      susto.style.display = 'flex';
      
      // 2. Quitar el mute (¡Suena el grito!)
      grito.muted = false;
      grito.play().catch(e => console.log("Error al sonar:", e));
      
      // 3. Pantalla completa
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    }, 10000); // 10 segundos
  }

  // 1. Intentamos arrancar el audio silenciado al cargar la página
  grito.play().then(() => {
    console.log("Autoplay silencioso permitido.");
    lanzarSusto();
  }).catch(e => {
    console.log("Autoplay bloqueado. Esperando que el usuario mueva el ratón...");
  });

  // 2. TRUCO: Si mueven el ratón o tocan la pantalla (sin hacer clic), desbloqueamos
  function desbloquearAudio() {
    if (yaIniciado) return;

    grito.volume = 0;
    grito.play().then(() => {
      grito.pause();
      grito.currentTime = 0;
      grito.muted = true; 
      grito.volume = 0.8;
      
      lanzarSusto();
    }).catch(() => {});
  }

  document.addEventListener('mousemove', desbloquearAudio, { once: true });
  document.addEventListener('touchstart', desbloquearAudio, { once: true });
});