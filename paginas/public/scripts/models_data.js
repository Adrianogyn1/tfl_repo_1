const MODELS = [
    // ==========================================
    // FEMININO
    // ==========================================
    // Cabeça / Corpo
    { slot: "10", name: 'HF_Head', gender: 'female', cat: 'head', modelFile: '/files/models/HF_Head.obj' },
    { slot: "10", name: 'HF_Head01', gender: 'female', cat: 'head', modelFile: '/files/models/HF_Head01.obj' },
    { slot: "10", name: 'HF_Head02', gender: 'female', cat: 'head', modelFile: '/files/models/HF_Head02.obj' },
    { slot: "10", name: 'HF_Head03', gender: 'female', cat: 'head', modelFile: '/files/models/HF_Head03.obj' },
    { slot: "10", name: 'AF_Head', gender: 'female', cat: 'head', modelFile: '/files/models/AF_Head.obj' },
    { slot: "10", name: 'FF_Head_Feline', gender: 'female', cat: 'head', modelFile: '/files/models/FF_Head_Feline.obj' },
    { slot: "10", name: 'FF_Head_Cat', gender: 'female', cat: 'head', modelFile: '/files/models/FF_Head_Cat.obj' },
    { slot: "10", name: 'FF_Head_Fox', gender: 'female', cat: 'head', modelFile: '/files/models/FF_Head_Fox.obj' },

    // Torso
    { slot: "30", name: 'HF_Upperbody_Corset', gender: 'female', cat: 'torso', modelFile: '/files/models/HF_Upperbody_Corset.obj' },
    { slot: "30", name: 'HF_Upperbody_TShirt', gender: 'female', cat: 'torso', modelFile: '/files/models/HF_Upperbody_TShirt.obj' },
    { slot: "30", name: 'HF_Upperbody_Blazer', gender: 'female', cat: 'torso', modelFile: '/files/models/HF_Upperbody_Blazer.obj' },
    { slot: "30", name: 'HF_Upperbody_Hoodie', gender: 'female', cat: 'torso', modelFile: '/files/models/HF_Upperbody_Hoodie.obj' },
    { slot: "30", name: 'HF_Upperbody_Dress', gender: 'female', cat: 'torso', modelFile: '/files/models/HF_Upperbody_Dress.obj' },
    { slot: "30", name: 'HF_Upperbody_LongCoat', gender: 'female', cat: 'torso', modelFile: '/files/models/HF_Upperbody_LongCoat.obj' },
    { slot: "30", name: 'HF_Upperbody_Tanktop', gender: 'female', cat: 'torso', modelFile: '/files/models/HF_Upperbody_Tanktop.obj' },
    { slot: "200", name: 'HF_Upperbody_Nude', gender: 'female', cat: 'torso', modelFile: '/files/models/HF_Upperbody_Nude.obj' },
   
    // Pernas
    { slot: "50", name: 'HF_Lowerbody_BaggyJeans', gender: 'female', cat: 'legs', modelFile: '/files/models/HF_Lowerbody_BaggyJeans.obj' },
    { slot: "50", name: 'HF_Lowerbody_Straightleg', gender: 'female', cat: 'legs', modelFile: '/files/models/HF_Lowerbody_Straightleg.obj' },
    { slot: "50", name: 'HF_Lowerbody_Bootcut', gender: 'female', cat: 'legs', modelFile: '/files/models/HF_Lowerbody_Bootcut.obj' },
    { slot: "50", name: 'HF_Lowerbody_FlareBottoms', gender: 'female', cat: 'legs', modelFile: '/files/models/HF_Lowerbody_FlareBottoms.obj' },
    { slot: "50", name: 'HF_Lowerbody_MiniSkirt', gender: 'female', cat: 'legs', modelFile: '/files/models/HF_Lowerbody_MiniSkirt.obj' },
    { slot: "50", name: 'HF_Lowerbody_ShortSkirt', gender: 'female', cat: 'legs', modelFile: '/files/models/HF_Lowerbody_ShortSkirt.obj' },
    { slot: "50", name: 'HF_Lowerbody_FlareLeg', gender: 'female', cat: 'legs', modelFile: '/files/models/HF_Lowerbody_FlareLeg.obj' },
    { slot: "50", name: 'HF_Lowerbody_Gown', gender: 'female', cat: 'legs', modelFile: '/files/models/HF_Lowerbody_Gown.obj' },
    { slot: "50", name: 'HF_Lowerbody_LongSkirt', gender: 'female', cat: 'legs', modelFile: '/files/models/HF_Lowerbody_LongSkirt.obj' },
    { slot: "50", name: 'HF_Lowerbody_Frillyskirt', gender: 'female', cat: 'legs', modelFile: '/files/models/HF_Lowerbody_Frillyskirt.obj' },
    { slot: "210", name: 'HF_Lowerbody_Genitals', gender: 'female', cat: 'legs', modelFile: '/files/models/HF_Lowerbody_Genitals.obj' },
 { slot: "210", name: 'HF_Lowerbody_Nude', gender: 'female', cat: 'legs', modelFile: '/files/models/HF_Lowerbody_Nude.obj' },

    // Cabelos / Chapéus
    { slot: "1", name: 'HF_Hair_Med_PonyCapBlack_Blond', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hair_Med_PonyCapBlack_Blond.obj' },
    { slot: "1", name: 'HF_Hair_Wavy', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hair_Wavy.obj' },
    { slot: "1", name: 'HF_Hair_LongStraight', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hair_LongStraight.obj' },
    { slot: "1", name: 'HF_Hair_Short', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hair_Short.obj' },
    { slot: "1", name: 'HF_Hair_Med_Shag', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hair_Med_Shag.obj' },
    { slot: "1", name: 'HF_Hair_Oriental_Tied', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hair_Oriental_Tied.obj' },
    { slot: "1", name: 'HF_Hat_Witch', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hat_Witch.obj' },
    { slot: "1", name: 'HF_Hair_BigPonytail', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hair_BigPonytail.obj' },
    { slot: "1", name: 'HF_Hair_Punk_MohawkSides', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hair_Punk_MohawkSides.obj' },
    { slot: "1", name: 'HF_Hair_Bob_Short', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hair_Bob_Short.obj' },
    { slot: "1", name: 'HF_Hat_Sailor', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hat_Sailor.obj' },
    { slot: "1", name: 'HF_Hair_Piggytail', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hair_Piggytail.obj' },
    { slot: "1", name: 'HF_Hat_Ski', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hat_Ski.obj' },
    { slot: "1", name: 'HF_Hair_Short_Straight', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hair_Short_Straight.obj' },
    { slot: "1", name: 'HF_Hat_Nurse', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hat_Nurse.obj' },
    { slot: "1", name: 'HF_Hair_Long_NoBangs', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hair_Long_NoBangs.obj' },
    { slot: "1", name: 'HF_Hair_Dreads_Shoulder', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hair_Dreads_Shoulder.obj' },
    { slot: "1", name: 'HF_Hair_Bob_Tied', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hair_Bob_Tied.obj' },
    { slot: "1", name: 'HF_Hair_Long_SwoopBangs', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hair_Long_SwoopBangs.obj' },
    { slot: "1", name: 'HF_Hair_Short_Vic', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hair_Short_Vic.obj' },
    { slot: "1", name: 'HF_Hat_Fedora', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hat_Fedora.obj' },
    { slot: "1", name: 'HF_Hat_Santa', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hat_Santa.obj' },
    { slot: "1", name: 'HF_Hair_Punk_Spiky', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hair_Punk_Spiky.obj' },
    { slot: "1", name: 'HF_Hair_Punk_SuperSpike', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hair_Punk_SuperSpike.obj' },
    { slot: "1", name: 'HF_Hair_Punk_Mohawk', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hair_Punk_Mohawk.obj' },
    { slot: "1", name: 'HF_Hair_Med_BobBangs', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hair_Med_BobBangs.obj' },
    { slot: "1", name: 'HF_Hat_Indian', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hat_Indian.obj' },
    { slot: "1", name: 'HF_Hair_LongParted', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hair_LongParted.obj' },
    { slot: "1", name: 'HM_Hair_Med_Bob', gender: 'female', cat: 'hair', modelFile: '/files/models/HM_Hair_Med_Bob.obj' },
    { slot: "1", name: 'HF_Hat_Catwoman', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hat_Catwoman.obj' },
    { slot: "1", name: 'HF_Hair_Long_CutBangs', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hair_Long_CutBangs.obj' },
    { slot: "1", name: 'HF_Hair_FrenchBraid', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hair_FrenchBraid.obj' },
    { slot: "1", name: 'HF_Hair_Med_Curly', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hair_Med_Curly.obj' },
    { slot: "1", name: 'HF_Hair_Long_Curly', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hair_Long_Curly.obj' },
    { slot: "1", name: 'HF_Hair_Med_Ponytail', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hair_Med_Ponytail.obj' },
    { slot: "1", name: 'HF_Hat_PonyBaseballCap', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hat_PonyBaseballCap.obj' },
    { slot: "1", name: 'HF_Hair_Pigtails', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hair_Pigtails.obj' },
    { slot: "1", name: 'HF_Hair_Med', gender: 'female', cat: 'hair', modelFile: '/files/models/HF_Hair_Med.obj' },

    // Calçados
    { slot: "70", name: 'HF_Shoes01', gender: 'female', cat: 'shoes', modelFile: '/files/models/HF_Shoes01.obj' },
    { slot: "70", name: 'HF_Shoes02', gender: 'female', cat: 'shoes', modelFile: '/files/models/HF_Shoes02.obj' },
    { slot: "70", name: 'HF_Shoes03', gender: 'female', cat: 'shoes', modelFile: '/files/models/HF_Shoes03.obj' },
    { slot: "70", name: 'HF_Shoes04', gender: 'female', cat: 'shoes', modelFile: '/files/models/HF_Shoes04.obj' },
    { slot: "70", name: 'HF_Shoes05', gender: 'female', cat: 'shoes', modelFile: '/files/models/HF_Shoes05.obj' },
    { slot: "70", name: 'HF_Shoes06', gender: 'female', cat: 'shoes', modelFile: '/files/models/HF_Shoes06.obj' },
    { slot: "70", name: 'HF_Shoes07', gender: 'female', cat: 'shoes', modelFile: '/files/models/HF_Shoes07.obj' },
    { slot: "70", name: 'HF_Shoes08', gender: 'female', cat: 'shoes', modelFile: '/files/models/HF_Shoes08.obj' },
    { slot: "70", name: 'HF_Shoes09', gender: 'female', cat: 'shoes', modelFile: '/files/models/HF_Shoes09.obj' },
    { slot: "70", name: 'HF_Shoes10', gender: 'female', cat: 'shoes', modelFile: '/files/models/HF_Shoes10.obj' },
    { slot: "70", name: 'HF_Shoes11', gender: 'female', cat: 'shoes', modelFile: '/files/models/HF_Shoes11.obj' },
    { slot: "70", name: 'HF_Shoes12', gender: 'female', cat: 'shoes', modelFile: '/files/models/HF_Shoes12.obj' },
    { slot: "70", name: 'HF_Shoes13', gender: 'female', cat: 'shoes', modelFile: '/files/models/HF_Shoes13.obj' },
    { slot: "70", name: 'HF_Shoes14', gender: 'female', cat: 'shoes', modelFile: '/files/models/HF_Shoes14.obj' },
    { slot: "70", name: 'HF_Shoes15', gender: 'female', cat: 'shoes', modelFile: '/files/models/HF_Shoes15.obj' },
    { slot: "70", name: 'HF_Shoes16', gender: 'female', cat: 'shoes', modelFile: '/files/models/HF_Shoes16.obj' },
    { slot: "70", name: 'HF_Shoes17', gender: 'female', cat: 'shoes', modelFile: '/files/models/HF_Shoes17.obj' },
    { slot: "70", name: 'HF_Shoes18', gender: 'female', cat: 'shoes', modelFile: '/files/models/HF_Shoes18.obj' },
    { slot: "70", name: 'HF_Shoes19', gender: 'female', cat: 'shoes', modelFile: '/files/models/HF_Shoes19.obj' },
    { slot: "70", name: 'HF_Shoes20', gender: 'female', cat: 'shoes', modelFile: '/files/models/HF_Shoes20.obj' },
    { slot: "70", name: 'HF_Shoes21', gender: 'female', cat: 'shoes', modelFile: '/files/models/HF_Shoes21.obj' },

    // Acessórios
    { slot: "255", name: 'HF_Glasses1', gender: 'female', cat: 'acc', modelFile: '/files/models/HF_Glasses1.obj' },
    { slot: "255", name: 'HF_Glasses2', gender: 'female', cat: 'acc', modelFile: '/files/models/HF_Glasses2.obj' },
    { slot: "255", name: 'HF_Glasses3', gender: 'female', cat: 'acc', modelFile: '/files/models/HF_Glasses3.obj' },
    { slot: "255", name: 'HF_Glasses4', gender: 'female', cat: 'acc', modelFile: '/files/models/HF_Glasses4.obj' },
    { slot: "255", name: 'HF_Glasses5', gender: 'female', cat: 'acc', modelFile: '/files/models/HF_Glasses5.obj' },
    { slot: "255", name: 'HF_Glasses6', gender: 'female', cat: 'acc', modelFile: '/files/models/HF_Glasses6.obj' },
    { slot: "255", name: 'HF_Mask', gender: 'female', cat: 'acc', modelFile: '/files/models/HF_Mask.obj' },

    // ==========================================
    // MASCULINO
    // ==========================================
    // Cabeça / Corpo
    { slot: "10", name: 'HM_Head', gender: 'male', cat: 'head', modelFile: '/files/models/HM_Head.obj' },
    { slot: "10", name: 'HM_Head_01', gender: 'male', cat: 'head', modelFile: '/files/models/HM_Head_01.obj' },
    { slot: "10", name: 'HM_Head_02', gender: 'male', cat: 'head', modelFile: '/files/models/HM_Head_02.obj' },
    { slot: "10", name: 'AM_Head', gender: 'male', cat: 'head', modelFile: '/files/models/AM_Head.obj' },
    { slot: "10", name: 'FM_Head_Cat', gender: 'male', cat: 'head', modelFile: '/files/models/FM_Head_Cat.obj' },
    { slot: "10", name: 'FM_Head_Feline', gender: 'male', cat: 'head', modelFile: '/files/models/FM_Head_Feline.obj' },
    { slot: "10", name: 'FM_Head_Fox', gender: 'male', cat: 'head', modelFile: '/files/models/FM_Head_Fox.obj' },

    // Torso
    { slot: "30", name: 'HM_Upperbody_TShirt', gender: 'male', cat: 'torso', modelFile: '/files/models/HM_Upperbody_TShirt.obj' },
    { slot: "30", name: 'HM_Upperbody_DressShirtTucked', gender: 'male', cat: 'torso', modelFile: '/files/models/HM_Upperbody_DressShirtTucked.obj' },
    { slot: "30", name: 'HM_Upperbody_Hoodie', gender: 'male', cat: 'torso', modelFile: '/files/models/HM_Upperbody_Hoodie.obj' },
    { slot: "30", name: 'HM_Upperbody_DressShirtTie', gender: 'male', cat: 'torso', modelFile: '/files/models/HM_Upperbody_DressShirtTie.obj' },
    { slot: "30", name: 'HM_Upperbody_DressShirtOpen', gender: 'male', cat: 'torso', modelFile: '/files/models/HM_Upperbody_DressShirtOpen.obj' },
    { slot: "30", name: 'HM_Upperbody_ElvisJacket', gender: 'male', cat: 'torso', modelFile: '/files/models/HM_Upperbody_ElvisJacket.obj' },
    { slot: "30", name: 'HM_Upperbody_Suit', gender: 'male', cat: 'torso', modelFile: '/files/models/HM_Upperbody_Suit.obj' },
    { slot: "30", name: 'HM_Upperbody_Polo', gender: 'male', cat: 'torso', modelFile: '/files/models/HM_Upperbody_Polo.obj' },
    { slot: "30", name: 'HM_Upperbody_LongSleeveTShirt', gender: 'male', cat: 'torso', modelFile: '/files/models/HM_Upperbody_LongSleeveTShirt.obj' },
    { slot: "200", name: 'HM_Upperbody_Nude', gender: 'male', cat: 'torso', modelFile: '/files/models/HM_Upperbody_Nude.obj' },
   
    // Pernas
    { slot: "50", name: 'HM_Lowerbody_Shorts', gender: 'male', cat: 'legs', modelFile: '/files/models/HM_Lowerbody_Shorts.obj' },
    { slot: "50", name: 'HM_Lowerbody_DressPants', gender: 'male', cat: 'legs', modelFile: '/files/models/HM_Lowerbody_DressPants.obj' },
    { slot: "50", name: 'HM_Lowerbody_Jeans', gender: 'male', cat: 'legs', modelFile: '/files/models/HM_Lowerbody_Jeans.obj' },
    { slot: "50", name: 'HM_Lowerbody_BaggyJeans', gender: 'male', cat: 'legs', modelFile: '/files/models/HM_Lowerbody_BaggyJeans.obj' },
    { slot: "210", name: 'HM_Lowerbody_Genitals', gender: 'male', cat: 'legs', modelFile: '/files/models/HM_Lowerbody_Genitals.obj' },
 { slot: "210", name: 'HM_Lowerbody_Nude', gender: 'male', cat: 'legs', modelFile: '/files/models/HM_Lowerbody_Nude.obj' },

    // Cabelos / Chapéus
    { slot: "1", name: 'HM_Hair_Long', gender: 'male', cat: 'hair', modelFile: '/files/models/HM_Hair_Long.obj' },
    { slot: "1", name: 'HM_Hat_King', gender: 'male', cat: 'hair', modelFile: '/files/models/HM_Hat_King.obj' },
    { slot: "1", name: 'HM_Hair_Ponytail', gender: 'male', cat: 'hair', modelFile: '/files/models/HM_Hair_Ponytail.obj' },
    { slot: "1", name: 'HM_Hair_Rocker', gender: 'male', cat: 'hair', modelFile: '/files/models/HM_Hair_Rocker.obj' },
    { slot: "1", name: 'HM_Hair_TopHat', gender: 'male', cat: 'hair', modelFile: '/files/models/HM_Hair_TopHat.obj' },
    { slot: "1", name: 'HM_Hair_Mohawk', gender: 'male', cat: 'hair', modelFile: '/files/models/HM_Hair_Mohawk.obj' },
    { slot: "1", name: 'HM_Hat_Ski', gender: 'male', cat: 'hair', modelFile: '/files/models/HM_Hat_Ski.obj' },
    { slot: "1", name: 'HM_Hair_Shoulder', gender: 'male', cat: 'hair', modelFile: '/files/models/HM_Hair_Shoulder.obj' },
    { slot: "1", name: 'HM_Hat_Cap', gender: 'male', cat: 'hair', modelFile: '/files/models/HM_Hat_Cap.obj' },
    { slot: "1", name: 'HM_Hair_Mid_ShortBlack', gender: 'male', cat: 'hair', modelFile: '/files/models/HM_Hair_Mid_ShortBlack.obj' },
    { slot: "1", name: 'HM_Hair_Mohawk2', gender: 'male', cat: 'hair', modelFile: '/files/models/HM_Hair_Mohawk2.obj' },
    { slot: "1", name: 'HM_Hair_Super_Spike', gender: 'male', cat: 'hair', modelFile: '/files/models/HM_Hair_Super_Spike.obj' },
    { slot: "1", name: 'HM_Hat_Pirate', gender: 'male', cat: 'hair', modelFile: '/files/models/HM_Hat_Pirate.obj' },
    { slot: "1", name: 'HM_Hair_Curly', gender: 'male', cat: 'hair', modelFile: '/files/models/HM_Hair_Curly.obj' },
    { slot: "1", name: 'HM_Hair_Fauxhawk', gender: 'male', cat: 'hair', modelFile: '/files/models/HM_Hair_Fauxhawk.obj' },
    { slot: "1", name: 'HM_Hair_Fedora', gender: 'male', cat: 'hair', modelFile: '/files/models/HM_Hair_Fedora.obj' },
    { slot: "1", name: 'HM_Hat_Fireman', gender: 'male', cat: 'hair', modelFile: '/files/models/HM_Hat_Fireman.obj' },
    { slot: "1", name: 'HM_Hat_Santa', gender: 'male', cat: 'hair', modelFile: '/files/models/HM_Hat_Santa.obj' },
    { slot: "1", name: 'HM_Hat_Sailor', gender: 'male', cat: 'hair', modelFile: '/files/models/HM_Hat_Sailor.obj' },
    { slot: "1", name: 'HM_Hair_Tuque', gender: 'male', cat: 'hair', modelFile: '/files/models/HM_Hair_Tuque.obj' },
    { slot: "1", name: 'HM_Hat_Cowboy', gender: 'male', cat: 'hair', modelFile: '/files/models/HM_Hat_Cowboy.obj' },
    { slot: "1", name: 'HM_Hair_Medium', gender: 'male', cat: 'hair', modelFile: '/files/models/HM_Hair_Medium.obj' },
    { slot: "1", name: 'HM_Skater', gender: 'male', cat: 'hair', modelFile: '/files/models/HM_Skater.obj' },
    { slot: "1", name: 'HM_Spiky', gender: 'male', cat: 'hair', modelFile: '/files/models/HM_Spiky.obj' },

    // Calçados
    { slot: "70", name: 'HM_Shoes01', gender: 'male', cat: 'shoes', modelFile: '/files/models/HM_Shoes01.obj' },
    { slot: "70", name: 'HM_Shoes02', gender: 'male', cat: 'shoes', modelFile: '/files/models/HM_Shoes02.obj' },
    { slot: "70", name: 'HM_Shoes03', gender: 'male', cat: 'shoes', modelFile: '/files/models/HM_Shoes03.obj' },
    { slot: "70", name: 'HM_Shoes04', gender: 'male', cat: 'shoes', modelFile: '/files/models/HM_Shoes04.obj' },
    { slot: "70", name: 'HM_Shoes05', gender: 'male', cat: 'shoes', modelFile: '/files/models/HM_Shoes05.obj' },
    { slot: "70", name: 'HM_Shoes06', gender: 'male', cat: 'shoes', modelFile: '/files/models/HM_Shoes06.obj' },
    { slot: "70", name: 'HM_Shoes07', gender: 'male', cat: 'shoes', modelFile: '/files/models/HM_Shoes07.obj' },

    // Acessórios
    { slot: "255", name: 'HM_Glasses1', gender: 'male', cat: 'acc', modelFile: '/files/models/HM_Glasses1.obj' },
    { slot: "255", name: 'HM_Glasses2', gender: 'male', cat: 'acc', modelFile: '/files/models/HM_Glasses2.obj' },
    { slot: "255", name: 'HM_Glasses3', gender: 'male', cat: 'acc', modelFile: '/files/models/HM_Glasses3.obj' },
    { slot: "255", name: 'HM_Glasses4', gender: 'male', cat: 'acc', modelFile: '/files/models/HM_Glasses4.obj' },
    { slot: "255", name: 'HM_Glasses5', gender: 'male', cat: 'acc', modelFile: '/files/models/HM_Glasses5.obj' },
    { slot: "255", name: 'HM_Monocle1', gender: 'male', cat: 'acc', modelFile: '/files/models/HM_Monocle1.obj' },
    { slot: "255", name: 'HM_Mask', gender: 'male', cat: 'acc', modelFile: '/files/models/HM_Mask.obj' },

    // ==========================================
    // UNISSEX / EXTRAS
    // ==========================================
    { slot: "11", name: 'Eye', gender: 'unisex', cat: 'acc', modelFile: '/files/models/Eye.obj' },
    { slot: "255", name: 'HM_FF_FoxTail', gender: 'unisex', cat: 'acc', modelFile: '/files/models/HM_FF_FoxTail.obj' },
    { slot: "255", name: 'HM_HF_Horns', gender: 'unisex', cat: 'acc', modelFile: '/files/models/HM_HF_Horns.obj' },
    { slot: "255", name: 'HM_FF_CatTail', gender: 'unisex', cat: 'acc', modelFile: '/files/models/HM_FF_CatTail.obj' },
    { slot: "255", name: 'HM_HF_Halo', gender: 'unisex', cat: 'acc', modelFile: '/files/models/HM_HF_Halo.obj' },
    { slot: "255", name: 'HM_FM_FoxTail', gender: 'unisex', cat: 'acc', modelFile: '/files/models/HM_FM_FoxTail.obj' },
    { slot: "255", name: 'HM_FM_CatTail', gender: 'unisex', cat: 'acc', modelFile: '/files/models/HM_FM_CatTail.obj' }
];

const SLOT = {
    "Skin": 0,
    "Hair": 1,
    "Head": 10,
    "Eye": 11, //Olhos
    "Eyebrows": 12, //Sobrancelhas
    "EyeLashes": 13, //Cilios
    "Teeth": 14, //Dentes
    "Jaw": 15, //
    "Beard": 16,

    "UpperBody": 30,
    "LowerBody": 50,
    "Feet": 70,
    "FullBody": 80,
    "None": 255
};

const CHANNELS = {
    "Default": 0,          // color
    "Skin": 1,             // skin
    "Skin_normal": 2,      // skin_normal
    "Cloth": 3,            // cloth
    "Cloth_normal": 4,     // cloth_normal
    "Nude": 5,             // nude
    "Nude_normal": 6,      // nude_normal
    "MakeUp": 7,           // make
    "MakeUp_normal": 8,    // make_normal
    "MakeEyes": 9,         // make_eyes
    "MakeLips": 10,        // make_lips
    "MakeBlush": 11,       // make_blush
    "Eyebrows": 12,        // eyebrows
    "Tattoo": 13,          // tatto
    "Tattoo_normal": 14,   // tatto_normal
    "Overlay": 15,         // overlay
    "Hair": 16,            // hair

    // PBR Padrão
    "Albedo": 17,          // albedo
    "Normal": 18,          // normal
    "Emissive": 19,        // emissive
    "Specular": 20,        // specular
    "Roughness": 21,       // roughness
    "Metallic": 22,        // metallic
    "AO": 23,              // ao
    "Displacement": 24,    // displacement

    // Canais adicionais
    "Subsurface": 25,      // subsurface
    "Transmission": 26,    // transmission
    "Anisotropy": 27,      // anisotropy
    "Clearcoat": 28,       // clearcoat
    "Rim": 29,             // rim
    "DetailAlbedo": 30,    // detail_albedo
    "DetailNormal": 31     // detail_normal
};