import pathlib,hashlib
p=pathlib.Path('parts')
head='''<!doctype html>
<html lang="en-AU">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>Bin Toss: Student Interactive | Mills Maths Tools</title>
  <meta name="description" content="A 3D classroom game. Choose your spot, set your throwing angle, time the power meter and collect data on how often the paper goes in the bin. Then set a cost to play and run the $50 prize stall for a profit." />
  <style>
'''
pwa='''<!-- Cloudflare Web Analytics --><script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "cf81850ba684422f95853dd3ff1b2a1f"}'></script><!-- End Cloudflare Web Analytics -->
<!-- mmt-pwa -->
<link rel="manifest" href="../../../../../manifest.webmanifest">
<meta name="theme-color" content="#1f3a5f">
<link rel="apple-touch-icon" href="../../../../../icons/apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="MMT">
<script src="../../../../../pwa.js" defer></script>
<!-- /mmt-pwa -->
</head>
'''
v=hashlib.md5(pathlib.Path('three.module.min.js').read_bytes()).hexdigest()[:8]
game=(p/'game.js').read_text()
assert "three.module.min.js?v="+v in game, v
out=head+(p/'style.css').read_text()+'  </style>\n'+pwa+(p/'body.html').read_text()+'\n<script id="btPhysics">\n'+(p/'physics.js').read_text()+'</script>\n<script type="module">\n'+game+'</script>\n</body>\n</html>\n'
pathlib.Path('index.html').write_text(out);print(len(out))
