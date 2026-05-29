import express from 'express'
const app = express()
const port = 3000

import routesPersonagens from "./routes/personagens"
import routesPer_hab from "./routes/per_hab"
import routesHabilidades from "./routes/habilidades"
import routesCompras from "./routes/compras"

app.use(express.json())

app.use("/personagens", routesPersonagens)
app.use("/personagem_habilidades", routesPer_hab)
app.use("/habilidades", routesHabilidades)
app.use("/compras", routesCompras)

app.get('/', (req, res) => {
  res.send('API: Sistema de Controle de habilidades de RPG')
})

app.listen(port, () => {
  console.log(`Servidor Rodando na Porta: ${port}`)
})
