import { prisma } from "../../lib/prisma"
import { Router } from 'express'
import { z } from 'zod'

const router = Router()

const compraSchema = z.object({
  Personagem_Id : z.number().int().positive(),
  Habilidade_Id : z.number().int().positive(),
})

router.get("/", async (req, res) => {
  try {
    const compras = await prisma.comprar_habilidade.findMany({
      include: {
        Personagem: true,
        Habilidade: true
      }
    })
    res.status(200).json(compras)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.get("/:Personagem_Id/:Habilidade_Id", async (req, res) => {

  const Personagem_Id = Number(req.params.Personagem_Id)
  const Habilidade_Id = Number(req.params.Habilidade_Id)

  const dadoPersonagem = await prisma.personagem.findUnique({
    where: { Id_personagem: Personagem_Id }
  })

  if (!dadoPersonagem) {
    res.status(400).json({ erro: "Erro... Código do personagem inválido" })
    return
  }

  const dadoHabilidade = await prisma.habilidade.findUnique({
    where: { Id_habilidade: Habilidade_Id }
  })

  if (!dadoHabilidade) {
    res.status(400).json({ erro: "Erro... Código da habilidade inválido" })
    return
  }

  try {
    const compra = await prisma.comprar_habilidade.findUnique({
      where: {
        Personagem_Id_Habilidade_Id: {
          Personagem_Id,
          Habilidade_Id
        }
      },
      include: {
        Personagem: true,
        Habilidade: true
      }
    })
    if (!compra) {
      res.status(404).json({
        erro: "Compra não encontrada"
      })
      return
    }

    res.status(200).json(compra)

  } catch (error) {
    res.status(400).json({ error })
  }
})

router.post("/", async (req, res) => {

  const valida = compraSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { Personagem_Id, Habilidade_Id } = valida.data

  const dadoPersonagem = await prisma.personagem.findUnique({
    where: { Id_personagem: Personagem_Id }
  })

  if (!dadoPersonagem) {
    res.status(400).json({ erro: "Erro... Código do personagem inválido" })
    return
  }

  const dadoHabilidade = await prisma.habilidade.findUnique({
    where: { Id_habilidade: Habilidade_Id }
  })

  if (!dadoHabilidade) {
    res.status(400).json({ erro: "Erro... Código da habilidade inválido" })
    return
  }

  if (Number(dadoHabilidade.Nivel_necessario ) > Number(dadoPersonagem.Nivel)) {
    res.status(400).json({ erro: `Erro... O personagem não está no nivel necessário para ter essa habilidade` })
    return
  }

  if (Number(dadoHabilidade.Pontos_necessarios) > Number(dadoPersonagem.Pontos)) {
    res.status(400).json({ erro: `Erro... O personagem não tem os pontos necessários para essa compra` })
    return
  }

  try {
    const [comprar_habilidade, personagem] = await prisma.$transaction([
      prisma.comprar_habilidade.create({
        data: { Personagem_Id, Habilidade_Id, Pontos_gastos: Number(dadoHabilidade.Pontos_necessarios), Analise_nivel: Number(dadoHabilidade.Nivel_necessario) },
        include: {
          Habilidade: true
        }
      }),
      prisma.personagem.update({
        where: { Id_personagem: Personagem_Id },
        data: { Pontos: { decrement: Number(dadoHabilidade.Pontos_necessarios) } }
      }),
    ])
    res.status(201).json({ comprar_habilidade, personagem })
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.delete("/:Personagem_Id/:Habilidade_Id", async (req, res) => {
  const Personagem_Id = Number(req.params.Personagem_Id)
  const Habilidade_Id = Number(req.params.Habilidade_Id)

  const dadoPersonagem = await prisma.personagem.findUnique({
    where: { Id_personagem: Personagem_Id }
  })

  if (!dadoPersonagem) {
    res.status(400).json({ erro: "Erro... Código do personagem inválido" })
    return
  }

  const dadoHabilidade = await prisma.habilidade.findUnique({
    where: { Id_habilidade: Habilidade_Id }
  })

  if (!dadoHabilidade) {
    res.status(400).json({ erro: "Erro... Código da habilidade inválido" })
    return
  }

  try {
    const compra = await prisma.comprar_habilidade.findUnique({
      where: {
        Personagem_Id_Habilidade_Id: {
          Personagem_Id,
          Habilidade_Id
        }
      }
    })

    if (!compra) {
      res.status(404).json({erro: "Compra não encontrada"})
      return
    }

    const [deleteCompra, personagem] = await prisma.$transaction([
      prisma.comprar_habilidade.delete({
        where: {
          Personagem_Id_Habilidade_Id: {
            Personagem_Id,
            Habilidade_Id
          }
        }
      }),

      prisma.personagem.update({
        where: {
          Id_personagem: Personagem_Id
        },
        data: {
          Pontos: {
            increment: compra.Pontos_gastos
          }
        }
      })
    ])

    res.status(200).json({
      deleteCompra,
      personagem,
    })

    } catch (error) {

    res.status(500).json({
      erro: "Erro interno do servidor"
    })
  }
})

export default router
