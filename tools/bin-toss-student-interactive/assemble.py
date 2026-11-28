import pathlib,hashlib,shutil,glob,os
p=pathlib.Path('parts');md=lambda f:hashlib.md5(pathlib.Path(f).read_bytes()).hexdigest()[:8]
head='''<!doctype html>
<html lang="en-AU">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>Bin Toss: Student Interactive | Mills Maths Tools</title>
  <meta name="description" content="A 3D classroom game. Choose your spot, set your throwing angle, time the power meter and collect data on how often the paper goes in the bin. Then set a cost to play and run the prize stall for a profit." />
  <script src="/portal/shared/portalHandoff.js?v=16b9c759" data-input="#btCode" data-button="#btCodeGo"></script>
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
game=''.join(pathlib.Path(f).read_text()+'\n' for f in sorted(glob.glob('parts/js/*.js')))
for k,f in [('GLTFV','addons/GLTFLoader.js'),('MESHV','addons/meshopt_decoder.module.js'),('SKELV','addons/SkeletonUtils.js'),('CLOUDV','parts/cloud.js')]:
    game=game.replace(k,md(f))
css=(p/'style.css').read_text().replace('CHARSV',md('chars.webp'))
i18n=(p/'i18n.js').read_text() if (p/'i18n.js').exists() else 'window.BT_I18N={};'
out=head+css+'  </style>\n'+pwa+(p/'body.html').read_text()+'\n<script id="btPhysics">\n'+(p/'physics.js').read_text()+'</script>\n<script id="btI18n">\n'+i18n+'\n</script>\n<script type="module">\n'+game+'</script>\n</body>\n</html>\n'
pathlib.Path('index.html').write_text(out);shutil.copy('parts/cloud.js','cloud.js');print(len(out))
D=os.environ.get('BT_SITE_DIR')  # e.g. the repo's interactive-tools/.../bin-toss/student-interactive/
if D:
 for f in ['index.html','cloud.js','chars.webp','three.module.min.js']+['addons/'+x for x in ['GLTFLoader.js','BufferGeometryUtils.js','SkeletonUtils.js','meshopt_decoder.module.js']]:shutil.copy(f,D)
