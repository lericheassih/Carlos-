"""Voix off intégrales des 3 publicités LUMO IMMOBILIER.
Chaque phrase = (section, texte affiché en sous-titre, texte prononcé ou None).
Sections : hook, probleme, solution, confiance, cta (structure publicitaire imposée)."""

VIDEOS = {
    1: dict(
        titre="Le bon terrain",
        speed=0.98,
        phrases=[
            ("hook", "Vous avez un projet de construction ?", None),
            ("hook", "Tout commence par le bon terrain.", None),
            ("probleme", "Un terrain, c'est la base de votre projet de vie.", None),
            ("probleme", "Un emplacement mal choisi, un dossier incomplet…", "Un emplacement mal choisi, un dossier incomplet,"),
            ("probleme", "et c'est tout votre projet qui se complique.", None),
            ("solution", "Chez LUMO IMMOBILIER, un conseiller vous accompagne.", "Chez Lumo Immobilier, un conseiller vous accompagne."),
            ("solution", "Choisir un emplacement adapté à votre projet.", None),
            ("solution", "S'intéresser de près aux documents du terrain.", None),
            ("solution", "Préparer votre acquisition, étape par étape.", None),
            ("confiance", "Lomé et ses environs se construisent.", None),
            ("confiance", "Votre projet mérite des fondations solides.", None),
            ("cta", "Vous avez un projet immobilier ?", None),
            ("cta", "Rendez-vous sur notre site et échangez avec un conseiller LUMO.", "Rendez-vous sur notre site, et échangez avec un conseiller Lumo."),
        ],
    ),
    2: dict(
        titre="La maison de vos rêves",
        speed=0.95,
        phrases=[
            ("hook", "Et si votre prochaine maison était exactement celle dont vous avez toujours rêvé ?", None),
            ("probleme", "Un salon baigné de lumière.", None),
            ("probleme", "Un jardin pour respirer.", None),
            ("probleme", "Une chambre où le calme vous attend, chaque soir.", None),
            ("solution", "Trouver ce bien, c'est d'abord savoir ce que vous voulez vraiment.", None),
            ("solution", "Chez LUMO IMMOBILIER, un conseiller écoute vos attentes,", "Chez Lumo Immobilier, un conseiller écoute vos attentes,"),
            ("solution", "votre budget, votre façon de vivre…", "votre budget, votre façon de vivre,"),
            ("solution", "et vous oriente vers des villas et des maisons qui vous ressemblent.", None),
            ("confiance", "Une recherche personnalisée. Un accompagnement à chaque étape.", None),
            ("cta", "Votre future maison vous attend peut-être déjà.", None),
            ("cta", "Rendez-vous sur notre site et parlez à un conseiller LUMO.", "Rendez-vous sur notre site, et parlez à un conseiller Lumo."),
        ],
    ),
    3: dict(
        titre="Investir au pays",
        speed=0.97,
        phrases=[
            ("hook", "Vous vivez à l'étranger…", "Vous vivez à l'étranger,"),
            ("hook", "mais votre projet, c'est au Togo ?", None),
            ("probleme", "Investir à distance soulève des questions.", None),
            ("probleme", "Quel bien choisir ? À qui faire confiance ?", None),
            ("probleme", "Comment avancer quand on vit loin ?", None),
            ("solution", "LUMO IMMOBILIER accompagne les investisseurs dans leur recherche de biens.", "Lumo Immobilier accompagne les investisseurs dans leur recherche de biens."),
            ("solution", "Terrains, villas, maisons, à Lomé et ses environs.", None),
            ("solution", "Un conseiller échange avec vous, où que vous soyez.", None),
            ("confiance", "Bâtir un patrimoine. Préparer votre retour. Penser à vos enfants.", None),
            ("confiance", "Votre projet peut commencer dès aujourd'hui.", None),
            ("cta", "Rendez-vous sur notre site et échangez avec un conseiller LUMO sur WhatsApp.", "Rendez-vous sur notre site, et échangez avec un conseiller Lumo sur WhatsApp."),
        ],
    ),
}
