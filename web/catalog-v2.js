// Una canción, un modelo por bloque, dos combinaciones ON/OFF. Ajustes orientativos propios.
(() => {
  const block = (block, model, settings, base = true, solo = base) => ({block, model, settings, base, solo});
  const amp = (model, gain, bass, mid, treble, presence) => block('AMP', model, `Gain ${gain} · Bass ${bass} · Mid ${mid} · Treble ${treble} · Presence ${presence} · MST: equilibrar volumen general`);
  const cab = model => block('CAB', model, 'ON con auriculares');
  const drive = (model, gain, base = false) => block('DS/OD', model, `Gain ${gain} · Level: ajustar de oído para un realce moderado, sin salto brusco; resto al valor inicial`, base, true);
  const delay = (model, time, mix = 18, base = false) => block('DELAY', model, `Time ${time} ms · Feedback 20 · Level/mezcla ${mix}`, base, true);
  const room = mix => block('REVERB', 'ROOM', `Level/mezcla ${mix} · Duración corta o media`);
  const song = (id, artist, name, pickup, blocks, notes, aliases = []) => ({id, artist, song:name, pickup, mood:'1 preset · base / solo · CTRL', blocks, notes, aliases});
  const bridge = 'Puente · single coil', neck = 'Mástil · humbucker', both = 'Ambas pastillas';
  const h = 'Jimi Hendrix', q = 'Queens of the Stone Age', f = 'Pink Floyd', i = 'Incubus', r = 'Rage Against the Machine';
  globalThis.toneAtlasCatalogV2 = [
    song('haze', h, 'Purple Haze', bridge,
      [drive('GREY FAZE',55,true),amp('PLX 100',35,38,65,50,35),cab('1960 412'),delay('TAPE',300,14),room(8)],
      'La base conserva el fuzz; CTRL añade eco al solo. Es una versión práctica con un mismo grado de distorsión en ambos estados. Volumen de guitarra al 10 y tono abierto, sin cambiar de pastilla al pulsar CTRL. Si queda chillón, baja Presence; si se emborrona, reduce Gain del fuzz. El eco del solo es una propuesta, no un ajuste oficial.'),
    song('wing', h, 'Little Wing', neck,
      [drive('TUBE DR',25),amp('PLX 100',18,28,55,58,35),cab('1960 412'),delay('TAPE',320,15),room(12)],
      'Base casi limpia; solo con TUBE DR y eco. Mantén la misma pastilla y volumen de guitarra al 8–9 en ambos estados. Si la humbucker oscurece los acordes, baja Bass a 20. El ajuste del solo es una adaptación con overdrive suave, sin reproducir todas las capas de la grabación.'),
    song('qotsa-no-one-knows', q, 'No One Knows', neck,
      [drive('PURE BOOST',15),amp('CITRUS 50',45,28,78,52,35),cab('CITRUS 412'),delay('DIGITAL',280,12),room(4)],
      'Base seca con medios marcados; CTRL añade un empuje y eco corto al solo. PURE BOOST tiene ganancia baja: ajusta su Level sin saturar excesivamente el ampli. Mantén volumen al 10 y tono abierto. Acorta las notas con ambas manos; reduce Bass si el mástil emborrona el riff. La afinación se ajusta en la guitarra.'),
    song('qotsa-go-with-the-flow', q, 'Go with the Flow', bridge,
      [drive('BLACKRAT',38,true),amp('PLX 100',38,38,65,48,30),cab('1960 412'),delay('DIGITAL',300,14),room(6)],
      'La distorsión permanece activa en ambos estados; CTRL añade solo el delay para destacar una línea melódica. No se cambia su ganancia ni se promete un aumento de volumen. Esta variante de solo es creativa y no reconstruye las guitarras superpuestas del disco. Si pierde definición, baja Gain del BLACKRAT.'),
    song('qotsa-little-sister', q, 'Little Sister', bridge,
      [drive('PURE BOOST',15),amp('J800',43,35,70,50,35),cab('1960 412'),delay('DIGITAL',280,13),room(5)],
      'Base con crunch; solo con boost y eco discreto. Mantén la single del puente y volumen al 10. Ajusta Level del PURE BOOST para ganar presencia sin un salto brusco; un ampli ya saturado puede añadir más compresión que volumen. Es una simplificación del solo, sin sus efectos especiales exactos.'),
    song('qotsa-make-it-wit-chu', q, 'Make It Wit Chu', neck,
      [drive('TUBE DR',28),amp('US BLUES OD',25,25,65,55,30),cab('BLUES 112'),delay('ANALOG',280,12),room(8)],
      'Base con crunch suave; CTRL activa overdrive y eco para el solo sin mover la ganancia del ampli. Usa la humbucker, tono abierto y volumen al 8–9 en ambos estados. Si pierde dinámica, reduce Gain del TUBE DR. Prioriza el groove y los silencios; si se emborrona, baja Bass a 20.'),
    song('floyd-time', f, 'Time', bridge,
      [drive('GREY FAZE',58),amp('HWT 103',25,35,65,50,30),cab('HWT 412'),delay('TAPE',380,20),room(10)],
      'Base con crunch ligero; CTRL activa fuzz y eco para el solo. Los dos estados comparten el mismo HWT 103. Volumen de guitarra al 10; ajusta Gain del fuzz si queda áspero. Los 380 ms son una propuesta propia. Trabaja bends afinados y reduce la mezcla del delay si tapa la frase siguiente. No incluye los relojes de la introducción.', ['floyd-time-rhythm','floyd-time-solo']),
    song('floyd-breathe', f, 'Breathe', neck,
      [block('MOD','PHASER','Velocidad lenta · Barrido suave, ajustar de oído'),drive('TUBE DR',22),amp('HWT 103',18,25,55,58,35),cab('HWT 412'),delay('TAPE',300,12,true),room(15)],
      'Base limpia con movimiento y eco; CTRL añade un overdrive suave para una línea solista. PHASER permanece encendido y es una alternativa aproximada al movimiento de un Uni-Vibe. El segundo estado es una adaptación para tocar melodías con guitarra normal: no reproduce la parte de slide. Mantén volumen de guitarra al 8 y tono abierto; baja Bass si el mástil queda oscuro.'),
    song('floyd-numb', f, 'Comfortably Numb', bridge,
      [drive('MUFFY',48),amp('HWT 103',18,30,65,50,28),cab('HWT 412'),delay('DIGITAL',370,20),room(12)],
      'Dos sonidos: base limpia y un único solo con MUFFY y delay, como compromiso para ambos solos de la canción. No hay un tercer estado para el solo final ni cambios de ampli. Mantén la single del puente y volumen al 10; ajusta el tono si resulta punzante. Los 370 ms son un punto de partida. Si se pierde definición, baja Gain del MUFFY a 38–40.', ['floyd-numb-base','floyd-numb-first-solo','floyd-numb-final-solo']),
    song('incubus-drive', i, 'Drive', both,
      [drive('TUBE DR',18),amp('65 US TW',15,30,50,60,35),cab('US TWN 212'),delay('ANALOG',280,12),room(10)],
      'Adaptación eléctrica: base limpia y un solo suave con overdrive y eco. No convierte tu guitarra en una acústica. Mantén volumen al 8 y tono abierto. Usa poca ganancia en TUBE DR para conservar el ataque; si el mástil domina con ambas pastillas, baja Bass a 20–25.'),
    song('incubus-wish', i, 'Wish You Were Here', both,
      [drive('OBSESSIVE DIST',48),amp('TRI REC CL',18,32,55,52,30),cab('REC 412'),block('MOD','ANA-CHORUS','Velocidad lenta · Profundidad y mezcla suaves',true,false),room(10)],
      'Base limpia con chorus; segundo estado fuerte/solista con distorsión y chorus apagado. Es también el estado para las partes fuertes de la canción. Se usa un ampli limpio común más un pedal de distorsión para que CTRL pueda hacerlo en una pulsación. El chorus es una opción de amplitud, no una identificación exacta del disco. Mantén ambas pastillas y volumen al 9.', ['incubus-wish-clean','incubus-wish-distortion']),
    song('incubus-pardon', i, 'Pardon Me', both,
      [block('MOD','PHASER','Velocidad lenta · Barrido suave',true,false),drive('OBSESSIVE DIST',52),amp('TRI REC CL',18,28,58,55,30),cab('REC 412'),room(8)],
      'Base limpia con phaser; segundo estado fuerte/solista con distorsión y phaser apagado, útil para el estribillo. El ampli permanece limpio y la distorsión viene de DS/OD: es una adaptación práctica en lugar de alternar dos modelos de ampli. Mantén ambas pastillas y volumen al 9. Los efectos y entradas de volumen de la grabación no se generan automáticamente.', ['incubus-pardon-clean','incubus-pardon-distortion']),
    song('ratm-killing-in-the-name', r, 'Killing in the Name', bridge,
      [drive('PURE BOOST',12),amp('J800',45,40,65,50,32),cab('1960 412'),room(4)],
      'Base y solo simplificado con un boost: CTRL no reproduce el Whammy del solo original. Para ese efecto haría falta configurar por separado PITCH SHIFT y EXP; aquí se priorizan dos estados fáciles de usar. Mantén volumen al 10 y tono abierto. Drop D: Re–La–Re–Sol–Si–Mi, de grave a agudo; baja solo la sexta cuerda a Re. Ajusta Level del boost para un realce moderado.'),
    song('ratm-bulls-on-parade', r, 'Bulls on Parade', neck,
      [block('FX/COMP','CRY WAH','Asigna EXP a WAH POSITION · Barrido manual · Mantener activado en ambos estados'),drive('PURE BOOST',12),amp('J800',42,28,70,55,30),cab('1960 412'),room(3)],
      'El wah permanece activo y EXP controla su posición en ambos estados. CTRL solo activa el boost para la variante solista; no lo asignes también al wah. Si EXP conmuta FX/COMP al pulsar la punta, deja el bloque encendido antes de usar CTRL. Mantén volumen al 10. El scratch del solo depende de la técnica y de cortes de señal: no se genera con el boost. Esta es una simplificación de dos sonidos, no una réplica del solo.'),
    song('ratm-guerrilla-radio', r, 'Guerrilla Radio', bridge,
      [block('FX/COMP','CRY WAH','Asigna EXP a WAH POSITION · Barrido manual',false,true),amp('J800',48,38,68,48,28),cab('1960 412'),room(4)],
      'Base seca; CTRL activa el wah para una variante solista aproximada. EXP mueve el wah, sin cambiar de preset. Asigna EXP a WAH POSITION y comprueba el recorrido. Si el interruptor de punta de EXP conmuta el bloque, vuelve al estado base antes de alternar con CTRL. No reproduce todos los efectos del solo original. Mantén la single del puente y volumen al 10; baja Gain si las notas se mezclan.')
  ];
})();
