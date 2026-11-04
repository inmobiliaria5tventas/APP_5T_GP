/**
 * Catálogo Oficial de Carpetas Google Drive — 5 Tierras
 * Repositorio: 02_PROYECTOS (ID: 1J2qkvpVKQcLD9pmryPXDC525tTnUIN8I)
 * Mapeo exhaustivo de carpetas para cada lote de los 4 proyectos.
 */
(function() {
  'use strict';

  const DRIVE_CATALOG = {
  "rootProyectos": "https://drive.google.com/drive/folders/1J2qkvpVKQcLD9pmryPXDC525tTnUIN8I",
  "projects": {
    "1": "https://drive.google.com/drive/folders/1M0VnXH-3eqa0_hhhA8vhe5VHwof5nfHX",
    "2": "https://drive.google.com/drive/folders/1kchcB8z0Ww4bchWCw1OHgVMqi36jlAwf",
    "3": "https://drive.google.com/drive/folders/1SkDDBKi_IIRMjWeSQbRorUAIX4HFEUTA",
    "4": "https://drive.google.com/drive/folders/1RyVMcSKiBOQZ0IWuUDDtc1dmogRd6PZP"
  },
  "lotesRoots": {
    "1": "https://drive.google.com/drive/folders/1I0NILvnscPh3a6Iwcwc7eOM_GF3247d2",
    "2": "https://drive.google.com/drive/folders/1qim5jGpxqUwLmPkPVb_MQLEHLaNNl2VK",
    "3": "https://drive.google.com/drive/folders/1Za8NUWdCue1aoNORBdG6LzbwYmuLiIra",
    "4": "https://drive.google.com/drive/folders/1gGjBE39pkPizK8ebTDKogvB8TnNAkg8j"
  },
  "lotes": {
    "1": {
      "3": "https://drive.google.com/drive/folders/1uriijUnQSG_h_2o_eihtFNl_z1ERyhri",
      "4": "https://drive.google.com/drive/folders/1PFSga7etU_5bLLI44RIQyOwJ-JeHrJgZ",
      "5": "https://drive.google.com/drive/folders/1icLBAhw8tMogPPdBEwpzAes3z_wdjg1I",
      "6": "https://drive.google.com/drive/folders/1LDSL2yCUmyyR5JK0jYAYIcmTEXIAdyX5",
      "7": "https://drive.google.com/drive/folders/1yOl-LBYvSPUF-0DWOj5S2Q_AxfD6UDiX",
      "8": "https://drive.google.com/drive/folders/15gbyMfMNfPgQqeVPbpcuvf0ujNtkd7-w",
      "9": "https://drive.google.com/drive/folders/1B_OXyeP2m8-Dwzwqrpb4Ye1CSz9poqdl",
      "10": "https://drive.google.com/drive/folders/1TgM8fJ1aBu1nRxXJ7NtMw5JWcr-f-iYW",
      "11": "https://drive.google.com/drive/folders/1y3RA2N8_Jm5kosbXak_ZHM-kD0AOiDkn",
      "12": "https://drive.google.com/drive/folders/1bSV-6bz6RmYey7mTNlPGwJU3YeeUlIau",
      "13": "https://drive.google.com/drive/folders/1aGNbycg_nRvcSQy4532j9k1jcWqOG1YD",
      "14": "https://drive.google.com/drive/folders/1ZPHx8FR_64f-143evyLelNhCpaYriIvk",
      "15": "https://drive.google.com/drive/folders/1GrqVkTBY6GMBlMnMmtdjwx1RM1A7bo61",
      "16": "https://drive.google.com/drive/folders/1fvtVSdAXcfKcXqjOt0q6PoG7GgEhc2ha",
      "17": "https://drive.google.com/drive/folders/1oKVv-DGWLpYdbXJCTpObTmczOdxEBlGZ",
      "18": "https://drive.google.com/drive/folders/1qZiAcOSBfgl87veJ6ZXhsIZ3pSxvO3f4",
      "19": "https://drive.google.com/drive/folders/1rYWQW0f8xWiYkcErX4BvIlKpPv_1vKcl",
      "20": "https://drive.google.com/drive/folders/132JwricT7Ffzu13I2EMLkyRZx_1zAPlb",
      "21": "https://drive.google.com/drive/folders/1R72dxHgkJI8-vvGGyW9g0_33mGXD-Hcr",
      "22": "https://drive.google.com/drive/folders/1Y_QXSym9DmUOtdR81Zhz_XYjdvSubuuA",
      "23": "https://drive.google.com/drive/folders/1ir_L75l_2TK6Y2m5XNJNsBYeiHCey5Hb",
      "24": "https://drive.google.com/drive/folders/13Ao21KiE2KCpmUxDnPUCmOTytdJbPEhK",
      "25": "https://drive.google.com/drive/folders/1js9mGiBV288fbC-DYLpxWLC76jzqdcAg",
      "26": "https://drive.google.com/drive/folders/1mZE3gdEnV8jdE0t9Be_DVE3N7o3TOzeP",
      "27": "https://drive.google.com/drive/folders/1Ym8lhaIw4xCvs0DscvllZMvyUzeoeCHr",
      "28": "https://drive.google.com/drive/folders/19HLig9eN262boSzcbmKg_J7u07Zdu96j",
      "29": "https://drive.google.com/drive/folders/19ysJWnxM8fnVXayndQie-Zrbpy7tOvEu",
      "30": "https://drive.google.com/drive/folders/19jHvzoSY5RSbcx9dewnoyvDqDVMaOBRJ",
      "31": "https://drive.google.com/drive/folders/1RAXrFbiF2xkEvASjqWOrZWnwheSdW6M1",
      "43": "https://drive.google.com/drive/folders/1qkAx5lT59PLwK2Sj5K30612MpdtOym6g",
      "44": "https://drive.google.com/drive/folders/1HI4s4hrWjlmBw1KocHtVEeqUfqaH8-bA",
      "45": "https://drive.google.com/drive/folders/1PDjjLYKjEvkaolIOA4BUfZKsaSZw-PBn",
      "46": "https://drive.google.com/drive/folders/1TsuYsc5IwqpuK0znGsXmej3INai-CcLB",
      "47": "https://drive.google.com/drive/folders/1SArmLcbgQMick0FN_1aZ13_2t21fcEBq",
      "48": "https://drive.google.com/drive/folders/1sCa15xTBUUVYVd6lm-wKlDtscSlyw27P",
      "49": "https://drive.google.com/drive/folders/1twu5di64ELe7Jk2H7-O_2kOW-Mc_n57w",
      "50": "https://drive.google.com/drive/folders/1wCjs_ibHOd_hB2q94QfhoL96xDSFU1Qf",
      "51": "https://drive.google.com/drive/folders/1hOAS1e8wvDOzbUSkwdNuNvuEqxwY-tGZ",
      "52": "https://drive.google.com/drive/folders/1ynwQ7si0LOCwIA3LFctZiiooiC_EBkqQ",
      "53": "https://drive.google.com/drive/folders/1TB9NJpNXYXRvXofB6HPiJX9uJLUnrSj3",
      "54": "https://drive.google.com/drive/folders/1EC5akwm6TKrihjfZwWK_96oEBrWCifRO",
      "55": "https://drive.google.com/drive/folders/1yVgutAsZXz9U7wyJPMe9g1lUBumIxkxD",
      "56": "https://drive.google.com/drive/folders/1ywuod5OhPh1jt4WkmZccch2ROUbsyswP",
      "57": "https://drive.google.com/drive/folders/1rADyddqv1iLN-upi0C4ijlbaFMhRcIE1",
      "58": "https://drive.google.com/drive/folders/12QSQ2aDW9EV63ubk8QuKAJJwz6WAJdHH",
      "59": "https://drive.google.com/drive/folders/1su1DHhZJhUiK3zzxj8cgmlUQpkAYsTBz"
    },
    "2": {
      "1": "https://drive.google.com/drive/folders/1JLkBWMQxedV2U_kaCPTcdLCIvCc0iPUZ",
      "2": "https://drive.google.com/drive/folders/1o48DAfjUyTu8xAmU_XuqR1LrCANY6qmP",
      "3": "https://drive.google.com/drive/folders/1Z7ueMniz6deKO4Hc0CKEWDd757CfVQ-m",
      "4": "https://drive.google.com/drive/folders/1VfU2g5derYS-Gio3NbSVOqXUuVUsYjjq",
      "5": "https://drive.google.com/drive/folders/1Ta1EmORH9KjDeL-9-c-8P-jG3sasHgCg",
      "6": "https://drive.google.com/drive/folders/1a-zDCecVQgyiHPjLuA_L2GcU3GzGPoM9",
      "7": "https://drive.google.com/drive/folders/1LMm5294KlQWzvwaMlJrNwlNtl-Ja6QvO",
      "8": "https://drive.google.com/drive/folders/1T-TA4e3XtrDi2M0wV_bUuUJvW4ybxiG_",
      "9": "https://drive.google.com/drive/folders/12_N1Oou-3iQt2YsgM4l6OFKE1lT-TK1k",
      "10": "https://drive.google.com/drive/folders/1g4QW44D0u4yCeH-dtTBwnshaqSHkS_VB",
      "11": "https://drive.google.com/drive/folders/1j06KZk-zINNnOmSZXFciJEoa0o0ON8Ax",
      "12": "https://drive.google.com/drive/folders/1WjSsIL3Gx111YJlwjEzGsEtM8F9Cg4AC",
      "13": "https://drive.google.com/drive/folders/1p6tmlOaBOvtuXcOa-FIlBAdc27M0wNa-",
      "14": "https://drive.google.com/drive/folders/16dd7hcdUFeRqavWhnnLgSIml-7W3wHwh",
      "15": "https://drive.google.com/drive/folders/12d-PsaZpV8PhiFHm6hyezR5RCwM6XMs8",
      "16": "https://drive.google.com/drive/folders/1FvnzMEnj1HrJs239AZI_SYxPOw7k949_",
      "17": "https://drive.google.com/drive/folders/1UnQk5OwdwbixvhuQIRss6btM6dx1hiDq",
      "18": "https://drive.google.com/drive/folders/1ql7t1OM_AT7K2-NnMMn_XePPtquXDMQM",
      "19": "https://drive.google.com/drive/folders/1zVNKkai_f61RuSDf7PHdWM_cjb0zrchh",
      "20": "https://drive.google.com/drive/folders/1ET6Yd32GhTLYF9NP26UwY0gt4OR49iRT",
      "21": "https://drive.google.com/drive/folders/1G6oxRiYER9-LX_TUGlgtoOvGQ99Qb8EP",
      "22": "https://drive.google.com/drive/folders/1KD22ocLE_ApICz_5baEhFSYvgDOY67_1",
      "23": "https://drive.google.com/drive/folders/1jpi3LTc2-wO7t-nw83NrQGYI0qw_zexA",
      "24": "https://drive.google.com/drive/folders/1XrXhmJ4BN-iUNAWHKxGovAds4jkCkwUa",
      "25": "https://drive.google.com/drive/folders/12iHp5Afb_I07B1ap0W8TL1dPl_-UcGVX",
      "26": "https://drive.google.com/drive/folders/1N6oUYQXeoDpa-b5H7lK9VYYsE4Cpi5zD",
      "27": "https://drive.google.com/drive/folders/1oxMzbNy208Uh8X1p-hDBpR9yAcgBw7T-",
      "28": "https://drive.google.com/drive/folders/1EjvFZY7jx5vS7RxB6HyIX5yYvYeJElwq",
      "29": "https://drive.google.com/drive/folders/1h3DPv2J869oCKqyLNVFEzgIEoR3F9zd7",
      "30": "https://drive.google.com/drive/folders/1Er5vLbV5zHu2BAHlJHJAd3PtrK9W0V8G",
      "31": "https://drive.google.com/drive/folders/1dDD4y80ns_H6I3luNIux75P27s6aWnW9",
      "32": "https://drive.google.com/drive/folders/1x3zpgCfty_fh83XknJLodFWIHhHaNy8v",
      "33": "https://drive.google.com/drive/folders/1hpdpv0QDsGvhxFyaS217NfB3Nu5LRfVN",
      "34": "https://drive.google.com/drive/folders/1xY2nckWHZvC3R0j-r5vm052A0cKsSqUU",
      "35": "https://drive.google.com/drive/folders/1MUYlnmzMYIkrx82eY0aoZpfLwW0-ATDI",
      "36": "https://drive.google.com/drive/folders/10jmwC1Mlpq26T5inD7w8i_g1mO2BFHh7",
      "37": "https://drive.google.com/drive/folders/1FFVyv3omc5dNAD9Uz_kzJNGWSVidrX8N",
      "38": "https://drive.google.com/drive/folders/1XW-MSOfBEQg-wDsNTqczoiY2FUY5z6vJ",
      "39": "https://drive.google.com/drive/folders/1_7NK9yAjVKKuqO2I5LD-7JBPJiJjpBmC",
      "40": "https://drive.google.com/drive/folders/1rTLHwMErUxfN49_tuaO8W_Bu7WkrK5Eq",
      "41": "https://drive.google.com/drive/folders/1bRIpCut45ZmhaQJcNLXCUrDX7uPNuBGP",
      "42": "https://drive.google.com/drive/folders/1K_aMd9IY8h3Idk00Wg9d2V4iV45Xgm3k",
      "43": "https://drive.google.com/drive/folders/1GYWani_JDOZs3L-bwcepiQUv6QBLc0bK",
      "44": "https://drive.google.com/drive/folders/1PsznFRHXb6FolUL5Xqh-nGceHOo5zJkG",
      "45": "https://drive.google.com/drive/folders/1xOnEzsRJL5LXWYPZi744QkEJe_I0iY-M",
      "46": "https://drive.google.com/drive/folders/1CDbtT7PN92Ik7bGrC4LRvFSvtqe9zzq3",
      "47": "https://drive.google.com/drive/folders/1zGBi6AWk4_cqeHQu12uZkNI0ZA29eGFC",
      "48": "https://drive.google.com/drive/folders/1k2T64snJuypC7XkIv9b5MT7drpFOhs6-",
      "49": "https://drive.google.com/drive/folders/1dNvhNDJHe3cV4lcNv8cW2dQ6VH8tfn2t",
      "50": "https://drive.google.com/drive/folders/1TOPaxInG0NjokSm9QxaMVw1gott1sC_3"
    },
    "3": {
      "1": "https://drive.google.com/drive/folders/13D9Ll6e8VYaiupm7ynwpAafDUCniTxJM",
      "2": "https://drive.google.com/drive/folders/1oqNAZZlEZpJf9l2P8pTgQ49u_cUcZZvK",
      "3": "https://drive.google.com/drive/folders/1Hjpkfw120LcN8a8yCt7uNv0P8uK1i2cA",
      "4": "https://drive.google.com/drive/folders/1RqiRQURPY4d6YuGHlEjYBHuIRg2EHAnX",
      "5": "https://drive.google.com/drive/folders/1EJkNoxgWZfENgHEHau5OZ_3_rdDsZFdX",
      "6": "https://drive.google.com/drive/folders/11lpbE70yhs5GZJEl5AeKbXYUcwcINQDV",
      "7": "https://drive.google.com/drive/folders/1QkhnW3NBwzAf8OdaJzLAL60gWTxrR7gY",
      "8": "https://drive.google.com/drive/folders/1MIFhvgM1dotTrL-pJpytb1_6R3BBf0tG",
      "9": "https://drive.google.com/drive/folders/1pvFJMJuQgjQHtwd85Jv4qlJLHYfL6hgh",
      "10": "https://drive.google.com/drive/folders/1QY3pcLKDLOsm9LGb_LTgdrPIx9d2ItWo",
      "11": "https://drive.google.com/drive/folders/1Cxx01awA7YFweU2L0_d1gEN4QGC0sdhG",
      "12": "https://drive.google.com/drive/folders/1swkSKXLJhEa4GoX_Jv2ZFUulUjaSvH0n",
      "13": "https://drive.google.com/drive/folders/1aQgH5qA2RlKLSTDvJH2mAkF3FtTDai3X",
      "14": "https://drive.google.com/drive/folders/1gUALVE4e4cmkcKKDUFqwXjtS82QBEGKK",
      "15": "https://drive.google.com/drive/folders/1zjVmBSK-6oibH-UtdRqKlyCI82mMJu9W",
      "16": "https://drive.google.com/drive/folders/1vtMCpPCl4PSI_dauMpXweKaNNm65V1Hj",
      "17": "https://drive.google.com/drive/folders/1tQKQ2C-Dv_kogM9c8CrgeKBxdxFTu5Yy",
      "18": "https://drive.google.com/drive/folders/1Mj-BzVdltETUByifp0SOu1F7BJwICVuK",
      "19": "https://drive.google.com/drive/folders/1lkbfW0Ub8e2-2U9vwyd_s_9H5-M-Fl7l",
      "20": "https://drive.google.com/drive/folders/18ZYHPABCMz_dxD4kMBI_j94aOqfCTu7Y",
      "21": "https://drive.google.com/drive/folders/1U7IgZR3W_aO6YupjLW-3GZq0RHEVb-Gr",
      "22": "https://drive.google.com/drive/folders/1JXf6TGfOBwJyMZx1PQBvNgfldYjQlgba",
      "23": "https://drive.google.com/drive/folders/1telxSjWMSINAdynj61-HdD9guo8VmJCp",
      "24": "https://drive.google.com/drive/folders/1cwCawY9FDdfDC7GaGIaie5WxjBnqBn-O",
      "25": "https://drive.google.com/drive/folders/13utzh6-qjRY4D3Q6NCHp19RhYsWcpGgf",
      "26": "https://drive.google.com/drive/folders/1DHGLkPY4WaGSM7xN1RCS-4yrUMGJfaGZ",
      "27": "https://drive.google.com/drive/folders/1V9NxX5KAD9orIw_QCICl7EeEIVhvN2zG",
      "28": "https://drive.google.com/drive/folders/1H9Fp-SylxhomkZjxJuO2_gb4wzLMRD02",
      "29": "https://drive.google.com/drive/folders/1OTIzB5yszgFStAaUP_ENbUx3mIaMBh85",
      "30": "https://drive.google.com/drive/folders/1eEVjG9pvjf-GTa__4E1xUBOYG87TGlcZ",
      "31": "https://drive.google.com/drive/folders/1xY9MFgtrirJ4OnyOqhxP1qYHApKUP4dE",
      "32": "https://drive.google.com/drive/folders/1_Ag75ifgcTDPQUv44d18RcMXu0GCVnuT",
      "33": "https://drive.google.com/drive/folders/1cplTispHr405_mDs_C-b4KVhDQcHeh54",
      "34": "https://drive.google.com/drive/folders/1z2ntqjkmeZzGtoP9lv61AAmkc00T88NU",
      "35": "https://drive.google.com/drive/folders/1lbvtZEQr1-rv0GvCzaoxrMS8o86mfu0J",
      "36": "https://drive.google.com/drive/folders/1_gGJXMbdMpCOenWOmMmwaiD9ul3sWU77",
      "37": "https://drive.google.com/drive/folders/1oScEzGbb5ZmQ-86VtUuZPcexjVQmaLMG",
      "38": "https://drive.google.com/drive/folders/10GOZj2lxiQccS9zalSK5gEPYYie_Avvi",
      "39": "https://drive.google.com/drive/folders/1SJl-1wScJptJj0_YFwmZQ8tkbP0bRpLU",
      "40": "https://drive.google.com/drive/folders/13tchilLAadXzgDIGfWEsdUfZK_rY0Z0T",
      "41": "https://drive.google.com/drive/folders/18_oYdze7xJDgoNvkFTO9Io29Gtcrswpx",
      "42": "https://drive.google.com/drive/folders/14QRjgfA-ZBcthzx3iBPcBJcPP-HnYsSl",
      "43": "https://drive.google.com/drive/folders/1YMQ6hVqlBV5RfpgOB3xSHgLbXsXWm-yg",
      "44": "https://drive.google.com/drive/folders/1OiVZs_CbvocQbz1QYDEbAgpuK7Un-pTc",
      "45": "https://drive.google.com/drive/folders/167JOkkLXUSoRo3IhgCChX_iaEmFbdfFj",
      "46": "https://drive.google.com/drive/folders/1CPRL5ce7jbQbilFMU9Dn16si_iRxOnfO",
      "47": "https://drive.google.com/drive/folders/1I2ZsgdVxtid-wyzGWz466xpHvrKXz92v",
      "48": "https://drive.google.com/drive/folders/19pE6Exf14pno4jUKY_z0Z4mf_wAkTSdx",
      "49": "https://drive.google.com/drive/folders/1M2iF46tlaQStzloenAzjfk_iK_-qv1fm",
      "50": "https://drive.google.com/drive/folders/1eGTW_ln3xdo3NDBXOcsvnphDGPohC2WD"
    },
    "4": {
      "105": "https://drive.google.com/drive/folders/1oqLdgnfZ3HiZTmaO3qDlhNMArTYY07ei",
      "106": "https://drive.google.com/drive/folders/1LXpm2AtRDrEIJx11cTjZ_sKTlAq7XpZw",
      "107": "https://drive.google.com/drive/folders/17DBoX8zbV3Nlb4LOC5GUXPqD1scjD2-9",
      "108": "https://drive.google.com/drive/folders/19sjqxePaUOjo_iP8XPNa8VvlI8cgfBUb",
      "109": "https://drive.google.com/drive/folders/1RkZI52DkFKW2AKLVcRAO3nJrVYX6yZah",
      "110": "https://drive.google.com/drive/folders/1FZPkSrrRqMGMXZ_ClHkOT254rOvdY6FH",
      "111": "https://drive.google.com/drive/folders/1PvzSY24hD3X4x3dBbuxJ6I1VPunUByWI",
      "112": "https://drive.google.com/drive/folders/1Bp3v2Uhv9C_9yBH_1BgYMgE1tjlQ0OfK",
      "113": "https://drive.google.com/drive/folders/1UilveSDAjoQSUMvDCRvUgtaawV_y_ud_",
      "114": "https://drive.google.com/drive/folders/1_QKgVpxOebCnvJKzDw0aQwTJAxzINaSW",
      "115": "https://drive.google.com/drive/folders/1MSu4D6i_mFSWFN_AW5h4wpFjInPgekyO",
      "116": "https://drive.google.com/drive/folders/1kEfkpubEKksg4s7fNrW0T2v0C4wbIJJR",
      "117": "https://drive.google.com/drive/folders/15uDh2oGZroZM9JoTGx9nSK0_EBMPyEhN",
      "118": "https://drive.google.com/drive/folders/1Sug8kRv-4WrQUK2X_wtpaSJt9aaNKUS5",
      "119": "https://drive.google.com/drive/folders/1qFKlIEBRIbxhkpKunqc4YoSq4lE7yfJK",
      "120": "https://drive.google.com/drive/folders/13klXB0t5MzON-lLQyfeqp_ku5K4PKvla",
      "121": "https://drive.google.com/drive/folders/1GgibXVWdxlIWU0YNAq0DQcChzGQRpRk3",
      "122": "https://drive.google.com/drive/folders/1vLvUCUi2HlKDsUH0vF_6x1Dk7OBAhqJM",
      "123": "https://drive.google.com/drive/folders/1jKPWjqplKuCGvQc1RXO1EFdgqnoR532X",
      "124": "https://drive.google.com/drive/folders/1iYMCrJmHchMOChKX79JqPHLoTsv3V6Ue",
      "125": "https://drive.google.com/drive/folders/1bmO2B70xVgB14XXPw5VNRR1j90-cOCsp",
      "126": "https://drive.google.com/drive/folders/1vGT8E2J2wjQ7YI_AcYDSDgn70A47BYCF",
      "127": "https://drive.google.com/drive/folders/1ujOwcUTE9tI4tC78GNSndteKW3JV5e6-",
      "128": "https://drive.google.com/drive/folders/1Txnf8wq1va6XzkKTkxUda9qjMrCg6zwo",
      "129": "https://drive.google.com/drive/folders/1eQwv99MmbSYqUHfBjqglokBmaQVxPWTP",
      "130": "https://drive.google.com/drive/folders/1FVEGlMCCuxnm8pcLXnvZtPWUk6kRm078",
      "131": "https://drive.google.com/drive/folders/1ZBQwEKwXuTFI-VkhIM2C8pCKSBY50Iia",
      "132": "https://drive.google.com/drive/folders/1KCrh1X8mc6RZZBQsnXSPpr6h5pgzHO-7",
      "133": "https://drive.google.com/drive/folders/1-hgDq26EkOeOVrqSs7XFUW3v07yAqPxm",
      "134": "https://drive.google.com/drive/folders/16SAU4pnEV7VV9AnOJyendSpeIOSecg6Q",
      "135": "https://drive.google.com/drive/folders/1uB4e4YOXdS2y9X0FNli9k4K2eZXQ9XZ-",
      "136": "https://drive.google.com/drive/folders/1RKiQEvxIrQVdGkaHQRa5hs5HJDb7MTmX",
      "137": "https://drive.google.com/drive/folders/1lGeWJ4ljpkL2cFVxcRwkPjRAI9fdYHbH",
      "138": "https://drive.google.com/drive/folders/1Z__-0kgMoqyRp2UIqYa5hU_gYymyPkIC",
      "139": "https://drive.google.com/drive/folders/1AUg4yOAjznm7ww6dc4_dSblyLeP4Wc6f",
      "140": "https://drive.google.com/drive/folders/1M--nFHVEacGxxMPXokoVpgA4AKEjqJtV",
      "141": "https://drive.google.com/drive/folders/1lYldo8pZxSpdf5KE199x9CblIBzqmPcq",
      "142": "https://drive.google.com/drive/folders/1DdxDK_PVNBfF7vDkGI_mHvViELAfandK",
      "143": "https://drive.google.com/drive/folders/1xhqy2Jjsp-LrNheBM8S59oMNimzqADfp",
      "144": "https://drive.google.com/drive/folders/1bFAr_7rzdCxc2VvHgcbsoylg6QSQQk1Z",
      "145": "https://drive.google.com/drive/folders/1XE7ASn2kFHPOMQqRiKwwhx_LT2i7OGuP",
      "146": "https://drive.google.com/drive/folders/1K5xXrz9kF4TXcOx0oYxhlDAx9wiB5kY_",
      "147": "https://drive.google.com/drive/folders/15sUEi024uq5AXN5JGbs5vDI4n-JyXP9-",
      "148": "https://drive.google.com/drive/folders/1xnL1sRqx0PqhrPD90lfUETQV3TpM4rFo",
      "149": "https://drive.google.com/drive/folders/15kQZnfqcdnWQZknzH11jazxLjJwyW-GO",
      "150": "https://drive.google.com/drive/folders/17Etxwp-mnw5D3XRhISOWZVUYD8kHm4CH",
      "151": "https://drive.google.com/drive/folders/19JbpN4MjOnFl3eLhIpg95q6FMhz8JKKw",
      "152": "https://drive.google.com/drive/folders/1ENd8ngsbXozZHx-hwCaTDJmzBPaA4jY5",
      "153": "https://drive.google.com/drive/folders/141hPv56IvzXNsdK1qjhCF1LwKuUa6Akp",
      "154": "https://drive.google.com/drive/folders/14_F2hPDALZLcR8AgeROGRiRUIcEfbQ0g"
    }
  }
};

  window.APP5T_DRIVE_CATALOG = {
    ROOT: DRIVE_CATALOG.rootProyectos,
    PROJECTS: DRIVE_CATALOG.projects,
    LOTES_ROOTS: DRIVE_CATALOG.lotesRoots,
    LOTES: DRIVE_CATALOG.lotes,

    getFolderForLote: function(idProy, loteNom) {
      const pid = parseInt(idProy, 10);
      const projLotes = DRIVE_CATALOG.lotes[pid] || {};
      const num = parseInt(String(loteNom || '').replace(/[^0-9]/g, ''), 10);
      if (!isNaN(num) && projLotes[num]) {
        return projLotes[num];
      }
      return DRIVE_CATALOG.lotesRoots[pid] || DRIVE_CATALOG.projects[pid] || DRIVE_CATALOG.rootProyectos;
    },

    getFolderForProject: function(idProy) {
      const pid = parseInt(idProy, 10);
      return DRIVE_CATALOG.projects[pid] || DRIVE_CATALOG.rootProyectos;
    },

    getLotesFolderForProject: function(idProy) {
      const pid = parseInt(idProy, 10);
      return DRIVE_CATALOG.lotesRoots[pid] || DRIVE_CATALOG.rootProyectos;
    },

    populateDatabaseUrls: function() {
      // IMPORTANTE: Actualizar URLs de Drive SOLO en memoria local (localStorage)
      // NUNCA llamar a APP5T_DB.update() en un bucle de inicio, ya que eso dispara
      // 232 peticiones PATCH a Supabase antes de descargar los estados reales (pullAll),
      // sobreescribiendo los lotes remotos con el estado por defecto 'Disponible'.
      try {
        const raw = localStorage.getItem('app5t_propiedades');
        if (!raw) return 0;
        const props = JSON.parse(raw);
        if (!Array.isArray(props)) return 0;
        let updatedCount = 0;
        props.forEach(p => {
          if (!p) return;
          const directUrl = window.APP5T_DRIVE_CATALOG.getFolderForLote(p.id_proyecto, p.nombre || p.id);
          if (!p.url || p.url.trim() === '' || p.url.includes('drive.google.com/drive/folders/1J2qkvpVKQcLD9pmryPXDC525tTnUIN8I') || p.url.includes('/search?q=')) {
            if (directUrl && directUrl !== p.url) {
              p.url = directUrl;
              updatedCount++;
            }
          }
        });
        if (updatedCount > 0) {
          localStorage.setItem('app5t_propiedades', JSON.stringify(props));
          console.log('APP5T_DRIVE_CATALOG: Se vincularon localmente ' + updatedCount + ' lotes con sus carpetas directas de Drive (sin sobreescribir Supabase).');
        }
        return updatedCount;
      } catch (e) {
        return 0;
      }
    }
  };
})();
