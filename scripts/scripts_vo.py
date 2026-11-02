# Scripts voix off : (texte affiché en sous-titre, texte prononcé par la TTS)
CTA = ("Écrivez-nous sur WhatsApp au 70 39 05 05 avec vos dates pour réserver.",
       "Écrivez-nous sur WhatsApp au soixante-dix, trente-neuf, zéro cinq, zéro cinq, avec vos dates pour réserver.")
VIDEOS = {
 1: dict(speed=1.07, blocks=[
   ("hook", "En mission à Lomé ? Travaillez et reposez-vous comme à la maison.", None),
   ("ben", "À Totsi, nos appartements meublés vous offrent le calme dont vous avez besoin.", None),
   ("ben", "Wifi rapide pour vos visioconférences, une grande table pour travailler, la climatisation dans chaque chambre.", None),
   ("ben", "Sécurité 24h/24, groupe électrogène et parking : vous restez concentré sur votre mission.",
           "Sécurité vingt-quatre heures sur vingt-quatre, groupe électrogène et parking : vous restez concentré sur votre mission."),
   ("price", "65 000 francs CFA la nuit, tout équipé.", "Soixante-cinq mille francs CFA la nuit, tout équipé."),
   ("cta",) + CTA]),
 2: dict(speed=0.98, blocks=[
   ("hook", "Vous rentrez à Lomé pour les fêtes ? Logez en famille, comme chez vous.", None),
   ("ben", "À Totsi, un grand salon pour se retrouver, une table pour les repas en famille,", None),
   ("ben", "et une cuisine tout équipée pour préparer les plats du pays.", None),
   ("ben", "Des chambres confortables et climatisées, des salles de bain modernes avec eau chaude.", None),
   ("ben", "Pas de contraintes d'hôtel : vous vivez à votre rythme.", None),
   ("price", "Tout ça pour 65 000 francs CFA la nuit.", "Tout ça pour soixante-cinq mille francs CFA la nuit."),
   ("cta",) + CTA]),
 3: dict(speed=1.08, blocks=[
   ("hook", "Un appartement tout équipé à Lomé pour 65 000 francs CFA la nuit ? Oui.",
            "Un appartement tout équipé à Lomé pour soixante-cinq mille francs CFA la nuit ? Oui."),
   ("ben", "Salon design. Lumières d'ambiance. Chambres élégantes. Douche à l'italienne.", None),
   ("ben", "Propre, moderne, climatisé, wifi inclus.", "Propre, moderne, climatisé, wifi inclus."),
   ("ben", "Le cadre parfait pour un week-end à deux à Totsi.", None),
   ("ben", "Une nuit, deux nuits ou plus : vous profitez, on s'occupe du reste.", None),
   ("price", "65 000 francs CFA la nuit. Pourquoi payer plus ?", "Soixante-cinq mille francs CFA la nuit. Pourquoi payer plus ?"),
   ("cta",) + CTA]),
}
