from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def path(name: str) -> Path:
    return ROOT / name


def read(name: str) -> str:
    return path(name).read_text(encoding="utf-8")


def write(name: str, content: str) -> None:
    path(name).write_text(content, encoding="utf-8")


def once(content: str, old: str, new: str, label: str) -> str:
    count = content.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly 1 match, got {count}")
    return content.replace(old, new, 1)


# 1) HTML: remove only the superseded video onboarding dialog.
html = read("index.html")
html, count = re.subn(
    r'\s*<dialog id="welcomeIntroDialog".*?</dialog>\s*',
    "\n",
    html,
    count=1,
    flags=re.S,
)
if count != 1:
    raise SystemExit(f"legacy welcome dialog: expected 1 match, got {count}")
write("index.html", html)


# 2) app.js: stale constants, element cache, handlers and startup branch for that dialog.
app = read("app.js")
app = once(app, '  const ONBOARDING_KEY = "prompt-ai-welcome-seen-v1";\n', "", "app onboarding key")
app = once(app, ',"welcomeIntroDialog","closeWelcomeIntroBtn","confirmWelcomeIntroBtn"', "", "app intro ids")
app, count = re.subn(
    r'\n  function closeWelcomeIntro\(\)\{.*?\n  function showWelcomeIntroOnce\(\)\{.*?\}\n',
    "\n",
    app,
    count=1,
    flags=re.S,
)
if count != 1:
    raise SystemExit(f"app intro functions: expected 1 match, got {count}")
app = once(
    app,
    "    el.closeWelcomeIntroBtn?.addEventListener('click',closeWelcomeIntro);el.confirmWelcomeIntroBtn?.addEventListener('click',closeWelcomeIntro);el.welcomeIntroDialog?.addEventListener('cancel',event=>{event.preventDefault();closeWelcomeIntro()});",
    "",
    "app intro handlers",
)
app = once(
    app,
    "    if(sessionStorage.getItem(CONTINUE_WORKFLOW_KEY)){sessionStorage.removeItem(CONTINUE_WORKFLOW_KEY);showWorkflow(1);}\n    else setTimeout(showWelcomeIntroOnce,350);",
    "    if(sessionStorage.getItem(CONTINUE_WORKFLOW_KEY)){sessionStorage.removeItem(CONTINUE_WORKFLOW_KEY);showWorkflow(1);}",
    "app intro startup",
)
write("app.js", app)


# 3) admin-console.js: preserve the current boot intro. Move the one useful internal
# reload shield behavior out of the legacy intro adapter before deleting it.
admin = read("admin-console.js")
admin = once(admin, "  const ONBOARDING_KEY='prompt-ai-welcome-seen-v1';\n", "", "admin onboarding key")
admin = once(admin, "    try{localStorage.setItem(ONBOARDING_KEY,'1')}catch{}\n", "", "admin onboarding write")
admin = once(admin, "await load('./intro-flow-fix.js?v=20260810-2');", "", "legacy intro loader")
admin = admin.replace(
    "#welcomeIntroDialog .welcome-intro-body,#welcomeIntroDialog .intro-close{visibility:hidden!important}",
    "",
)
route_guard = """  function preserveInternalRouteReloads(){
    const observer=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes){if(!(node instanceof Element))continue;const shield=node.matches?.('.prompt-route-shield')?node:node.querySelector?.('.prompt-route-shield');if(!shield)continue;try{sessionStorage.setItem(CONTINUE_WORKFLOW_KEY,'1')}catch{}shield.querySelector('img')?.remove()}});
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

"""
anchor = "  function mountBootIntro(){\n"
if anchor not in admin:
    raise SystemExit("boot intro anchor missing")
admin = admin.replace(anchor, route_guard + anchor, 1)
admin = once(
    admin,
    "  mountBootIntro();\n",
    "  preserveInternalRouteReloads();\n  mountBootIntro();\n",
    "route guard init",
)
write("admin-console.js", admin)


# 4) CSS: remove only selectors/rules that belonged to the deleted onboarding UI.
# Shared app-action and agent-launch rules are retained, with only the obsolete selector removed.
css = read("styles.css")
selector_replacements = {
    ".welcome-intro-dialog,.app-action-dialog,.agent-launch-dialog{": ".app-action-dialog,.agent-launch-dialog{",
    ".welcome-intro-dialog .dialog-frame,.app-action-dialog .dialog-frame,.agent-launch-dialog .dialog-frame{": ".app-action-dialog .dialog-frame,.agent-launch-dialog .dialog-frame{",
    ".welcome-intro-dialog::backdrop,.app-action-dialog::backdrop,.agent-launch-dialog::backdrop{": ".app-action-dialog::backdrop,.agent-launch-dialog::backdrop{",
    ".intro-close,.agent-launch-close{": ".agent-launch-close{",
    ".welcome-intro-body,.agent-launch-body{": ".agent-launch-body{",
    ".welcome-intro-body>span,.agent-launch-body>span,.app-action-body>span{": ".agent-launch-body>span,.app-action-body>span{",
    ".welcome-intro-body h2,.agent-launch-body h2,.app-action-body h2{": ".agent-launch-body h2,.app-action-body h2{",
    ".welcome-intro-body>p,.agent-launch-body>p,.app-action-body>p{": ".agent-launch-body>p,.app-action-body>p{",
    ".welcome-intro-body,.agent-launch-body,.app-action-body{": ".agent-launch-body,.app-action-body{",
    ".welcome-intro-body h2,.agent-launch-body h2{": ".agent-launch-body h2{",
}
for old, new in selector_replacements.items():
    css = css.replace(old, new)

# These rules are legacy-only and styles.css stores several rules on the same physical line,
# so remove complete CSS rule fragments instead of dropping whole lines.
legacy_rule_patterns = (
    r'\.welcome-intro-video\{[^}]*\}',
    r'\.welcome-intro-body ol\{[^}]*\}',
    r'\.welcome-intro-body li\{[^}]*\}',
    r'\.welcome-intro-body li>b\{[^}]*\}',
    r'\.welcome-intro-body li strong,\.welcome-intro-body li small\{[^}]*\}',
    r'\.welcome-intro-body li small\{[^}]*\}',
    r'\.welcome-intro-body>\.solid-btn\{[^}]*\}',
)
for pattern in legacy_rule_patterns:
    css = re.sub(pattern, "", css)
write("styles.css", css)


# 5) Small proven-unused home bookkeeping; visible title behavior stays the same.
home = read("promptai-home-final.js")
home = home.replace("  let timer=0,lastTitle='';", "  let timer=0;")
home = home.replace(
    "    const desired=name?`Willkommen, ${name}.`:'Willkommen.';lastTitle=desired;\n",
    "    const desired=name?`Willkommen, ${name}.`:'Willkommen.';\n",
)
write("promptai-home-final.js", home)


# 6) Service worker: no longer cache a deleted legacy JS adapter.
sw = read("sw.js")
sw = sw.replace(",'/intro-flow-fix.js'", "").replace(",'./intro-flow-fix.js'", "")
write("sw.js", sw)


# 7) Smoke test: test the current background-loading boot implementation instead.
tests = read("tests/smoke.test.mjs")
old_test = "test('intro is a logo splash and no longer depends on intro video playback',async()=>{const src=await text('intro-flow-fix.js');assert.match(src,/prompt-logo-splash/);assert.match(src,/sitebrief-logo\\.svg/);assert.match(src,/#278bc2/);assert.match(src,/removeAttribute\\('autoplay'\\)/)});"
new_test = "test('app boot intro covers background loading without legacy media',async()=>{const src=await text('admin-console.js'),html=await text('index.html'),sw=await text('sw.js');assert.match(src,/promptAppBoot/);assert.match(src,/sitebrief-logo\\.svg/);assert.match(src,/releaseBootIntro/);assert.match(src,/preserveInternalRouteReloads/);assert.doesNotMatch(src,/intro-flow-fix\\.js|welcomeIntroDialog|ONBOARDING_KEY/);assert.doesNotMatch(html,/welcomeIntroDialog|welcome-intro-video|intro\\.(?:webm|mp4)/);assert.doesNotMatch(sw,/intro-flow-fix\\.js/)});"
tests = once(tests, old_test, new_test, "intro smoke test")
write("tests/smoke.test.mjs", tests)


# 8) Remove assets/code with no remaining runtime consumer.
for obsolete in ("intro-flow-fix.js", "intro.mp4", "intro.webm"):
    path(obsolete).unlink(missing_ok=True)

# Temporary cleanup machinery deletes itself from the resulting app commit.
path("scripts/cleanup_legacy.py").unlink(missing_ok=True)
path(".github/workflows/cleanup-legacy.yml").unlink(missing_ok=True)


# Hard safety checks before tests/commit: current boot, core workflow and permissions remain.
runtime = {
    name: read(name)
    for name in ("index.html", "styles.css", "app.js", "admin-console.js", "sw.js")
}
legacy_pattern = re.compile(
    r"welcomeIntroDialog|welcome-intro-video|intro-flow-fix\.js|intro\.(?:webm|mp4)|ONBOARDING_KEY"
)
for name, content in runtime.items():
    if legacy_pattern.search(content):
        raise SystemExit(f"{name}: legacy onboarding reference remains")

for required in ("promptAppBoot", "releaseBootIntro", "preserveInternalRouteReloads"):
    if required not in runtime["admin-console.js"]:
        raise SystemExit(f"current boot flow changed: missing {required}")
for required in ("const PLAN_RULES", "workspaceNewProjectBtn", "buildMasterPrompt", "ultimate", "pro"):
    if required not in runtime["app.js"]:
        raise SystemExit(f"workflow/permission core changed: missing {required}")

print("Conservative cleanup prepared; safety assertions passed.")
