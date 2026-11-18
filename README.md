# Rig Tablet

Editor de animação esquelética 2D adaptado para tablet e caneta (iPad + Apple Pencil). Funciona offline
depois de aberto uma vez.

**Instalar no iPad:** abra o endereço deste site no Safari → Compartilhar → *Adicionar à Tela de Início*.
O ícone abre o editor em tela cheia, sem internet.

## Origem e licença

Rig Tablet é baseado no [Rigby2D](https://github.com/jaisurya-dev-art/rigby2d) (código aberto, sob
MIT **ou** Apache-2.0, à sua escolha — veja `LICENSE-MIT` e `LICENSE-APACHE`; componentes de terceiros
em `THIRD_PARTY_NOTICES.md`). Não é afiliado ao projeto Rigby2D. Os nomes Rigby2D, NILA e Rigbytron e
seus logos são marcas do projeto Rigby2D e não são usados aqui como marca deste app.

### Alterações em relação ao Rigby2D 0.5.1

- Modo tablet: interface maior para toque, divisórias largas, barra flutuante com ferramentas, eixos,
  onion, guias, auto key, Setup/Animate, desfazer/refazer, Shift/Ctrl/Alt fixos e controles de quadro.
- Caneta e dedos: a caneta é a ferramenta (a pressão controla o pincel de pesos); dedos movem e dão
  zoom (pinça); toque de 2 dedos desfaz, de 3 refaz; a palma apoiada é ignorada.
- App instalável e offline (manifest + service worker).
- Nome e ícone próprios; sem os projetos de demonstração e sem as notícias/links de comunidade do Rigby2D.

Arquivos gerados com `npm run pwa:build` a partir do código-fonte modificado.
