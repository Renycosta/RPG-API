import { prisma } from "../../lib/prisma";
import { Classes } from "../../generated/prisma/enums";
import { Router } from "express"
import { z } from "zod"
// import nodemailer from "nodemailer"

const router = Router()

export function calcularPontosPorNivel(nivel: number): number {
    return nivel * 20;
}

const personagemSchema = z.object({
    Nome_personagem: z.string()
        .min(3, 'Nome do personagem deve possuir no mínimo com 3 caracteres')
        .max(40, 'Nome do personagem deve ter no máximo 40 caracteres'),
    Classe: z.enum(Classes),
    Nivel: z.number()
        .positive('Valor deve ser um número positivo')
})

router.get("/", async (req, res) => {
    try {
        const personagens = await prisma.personagem.findMany({
            // include: { Personagem_habilidade: true }
        })
        res.status(200).json(personagens)
    } catch (error) {
        res.status(500).json({ erro: "Erro no servidor" })
    }
})

router.get('/:Id_personagem', async (req, res) => {
    const id = Number(req.params.Id_personagem)
    if (Number.isNaN(id)) {
        res.status(400).json({ erro: 'Código inválido' })
        return
    }

    try {
        const personagem = await prisma.personagem.findUnique({ 
            where: { Id_personagem: id } 
        })

        if (!personagem) {
            res.status(404).json({ erro: 'Personagem não cadastrada' })
            return
        }

        res.status(200).json(personagem)
    } catch (error) {
        console.log(error)
        res.status(500).json({ erro: 'Erro interno do servidor' })
    }
})

router.post("/", async (req, res) => {
    const valida = personagemSchema.safeParse(req.body)
    if (!valida.success) {
        res.status(400).json({ erro: valida.error })
        return
    }

    const { Nome_personagem, Classe, Nivel } = valida.data

    const pontosCalculados = calcularPontosPorNivel(Nivel)

    try {
        const personagem = await prisma.personagem.create({
            data: { Nome_personagem, Classe, Nivel, Pontos: pontosCalculados }
        })
        res.status(201).json(personagem)
    } catch (error) {
        res.status(500).json({ error })
    }
})

router.put("/:Id_personagem", async (req, res) => {
    const { Id_personagem } = req.params

    const valida = personagemSchema.safeParse(req.body)
    if (!valida.success) {
        res.status(400).json({ erro: valida.error })
        return
    }

    const { Nome_personagem, Classe, Nivel } = valida.data

    try {
        const personagem = await prisma.personagem.update({
            where: { Id_personagem: Number(Id_personagem) },
            data: { Nome_personagem, Classe, Nivel }
        })
        res.status(200).json(personagem)
    } catch (error) {
        res.status(500).json({ erro: error })
    }
})

router.delete("/:Id_personagem", async (req, res) => {
    const { Id_personagem } = req.params

    try {
        const personagem = await prisma.personagem.delete({
            where: { Id_personagem: Number(Id_personagem) }
        })
        res.status(200).json(personagem)
    } catch (error) {
        res.status(500).json({ erro: error })
    }
})

export default router