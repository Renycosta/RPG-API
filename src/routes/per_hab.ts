import { prisma } from "../../lib/prisma"
import { Router } from "express"

const router = Router()

router.get("/", async (req, res) => {
  try {
    const registros = await prisma.personagem_habilidade.findMany({
      include: {
        Personagem: true,
        Habilidade: true
      }
    })
    res.status(200).json(registros)
  } catch (error) {
    res.status(500).json({erro: "Erro interno do servidor"})
  }
})

router.get('/:Id', async (req, res) => {
    const id = Number(req.params.Id)
    if (Number.isNaN(id)) {
        res.status(400).json({ erro: 'Código inválido' })
        return
    }

    try {
        const personagem_habilidade = await prisma.personagem_habilidade.findUnique({ 
            where: { Id: id }, 
            include: {
              Personagem: true,
              Habilidade: true
            }
        })

        if (!personagem_habilidade) {
            res.status(404).json({ erro: 'A habilidade dp personagem não foi cadastrada' })
            return
        }

        res.status(200).json(personagem_habilidade)
    } catch (error) {
        console.log(error)
        res.status(500).json({ erro: 'Erro interno do servidor' })
    }
})

export default router