/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/quota_vault.json`.
 */
export type QuotaVault = {
  "address": "CjMHzbSLp1riwY4QPbBSgpjE8jzawFZV86X6sYvMH58Y",
  "metadata": {
    "name": "quotaVault",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "closeVault",
      "discriminator": [
        141,
        103,
        17,
        126,
        72,
        75,
        29,
        29
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "consume",
      "discriminator": [
        65,
        178,
        141,
        13,
        95,
        57,
        76,
        154
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.owner",
                "account": "vaultAccount"
              }
            ]
          },
          "relations": [
            "seat"
          ]
        },
        {
          "name": "seat",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  97,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "account",
                "path": "seat.seat_id",
                "account": "seatAccount"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "credits",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createSeat",
      "discriminator": [
        91,
        13,
        230,
        183,
        58,
        95,
        118,
        199
      ],
      "accounts": [
        {
          "name": "seat",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  97,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "arg",
                "path": "seatId"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "vault"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "holder",
          "type": "pubkey"
        },
        {
          "name": "seatId",
          "type": "u64"
        },
        {
          "name": "seatType",
          "type": "u8"
        },
        {
          "name": "monthlyLimit",
          "type": "u64"
        }
      ]
    },
    {
      "name": "depositHandler",
      "discriminator": [
        132,
        252,
        211,
        213,
        15,
        163,
        42,
        43
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.owner",
                "account": "vaultAccount"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "vault"
          ]
        },
        {
          "name": "fromTokenAccount",
          "writable": true
        },
        {
          "name": "vaultTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeVault",
      "discriminator": [
        48,
        191,
        163,
        44,
        71,
        129,
        63,
        164
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "apiSigner",
          "type": "pubkey"
        },
        {
          "name": "plan",
          "type": "u8"
        }
      ]
    },
    {
      "name": "toggleSeatHandler",
      "discriminator": [
        253,
        234,
        87,
        246,
        224,
        89,
        180,
        112
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.owner",
                "account": "vaultAccount"
              }
            ]
          },
          "relations": [
            "seat"
          ]
        },
        {
          "name": "seat",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  97,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "account",
                "path": "seat.seat_id",
                "account": "seatAccount"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "updateSeatHandler",
      "discriminator": [
        201,
        155,
        97,
        171,
        24,
        80,
        120,
        186
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.owner",
                "account": "vaultAccount"
              }
            ]
          },
          "relations": [
            "seat"
          ]
        },
        {
          "name": "seat",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  97,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "account",
                "path": "seat.seat_id",
                "account": "seatAccount"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newLimit",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawFromVault",
      "discriminator": [
        180,
        34,
        37,
        46,
        156,
        0,
        211,
        238
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "vaultTokenAccount",
          "writable": true
        },
        {
          "name": "ownerTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "seatAccount",
      "discriminator": [
        251,
        85,
        162,
        147,
        128,
        212,
        122,
        178
      ]
    },
    {
      "name": "vaultAccount",
      "discriminator": [
        230,
        251,
        241,
        83,
        139,
        202,
        93,
        28
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorizedSigner",
      "msg": "Unauthorized signer"
    },
    {
      "code": 6001,
      "name": "seatInactive",
      "msg": "Seat inactive"
    },
    {
      "code": 6002,
      "name": "vaultInactive",
      "msg": "Vault inactive"
    },
    {
      "code": 6003,
      "name": "quotaExceeded",
      "msg": "Quota exceeded"
    },
    {
      "code": 6004,
      "name": "invalidLimit",
      "msg": "New limit cannot be below already consumed usage"
    },
    {
      "code": 6005,
      "name": "exceedsPerCallLimit",
      "msg": "Exceeds per call limit"
    },
    {
      "code": 6006,
      "name": "dailyLimitExceeded",
      "msg": "Daily limit exceeded"
    },
    {
      "code": 6007,
      "name": "invalidDepositAmount",
      "msg": "Invalid Deposit Amount"
    },
    {
      "code": 6008,
      "name": "invalidSeatType",
      "msg": "Invalid Seat Type"
    },
    {
      "code": 6009,
      "name": "invalidCredits",
      "msg": "Invalid Credits"
    },
    {
      "code": 6010,
      "name": "mathOverflow",
      "msg": "Math overflow"
    },
    {
      "code": 6011,
      "name": "insufficientFunds",
      "msg": "Insufficient Funds"
    },
    {
      "code": 6012,
      "name": "vaultNotEmpty",
      "msg": "Vault still contains funds"
    },
    {
      "code": 6013,
      "name": "vaultStillActive",
      "msg": "Vault is still active"
    }
  ],
  "types": [
    {
      "name": "seatAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "holder",
            "type": "pubkey"
          },
          {
            "name": "consumed",
            "type": "u64"
          },
          {
            "name": "monthlyLimit",
            "type": "u64"
          },
          {
            "name": "seatId",
            "type": "u64"
          },
          {
            "name": "periodStart",
            "type": "i64"
          },
          {
            "name": "seatType",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "active",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "vaultAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "apiSigner",
            "type": "pubkey"
          },
          {
            "name": "totalDeposited",
            "type": "u64"
          },
          {
            "name": "totalAllocated",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "active",
            "type": "bool"
          },
          {
            "name": "plan",
            "type": "u8"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    }
  ]
};
