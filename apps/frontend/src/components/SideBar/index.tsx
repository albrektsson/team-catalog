import * as React from 'react'
import { theme } from '../../util'
import { Block, BlockProps } from 'baseui/block'
import { H6, Paragraph4 } from 'baseui/typography'
import NavLogo from '../../resources/navlogo.svg'
import { StyledLink } from 'baseui/link'
import NavItem from './NavItem'
import SlackLogo from '../../resources/Slack_Monochrome_White.svg'

const sideBarProps: BlockProps = {
  position: 'fixed',
  height: '100%',
  width: '240px',
  backgroundColor: theme.colors.primaryA,
}

const items: BlockProps = {
  marginLeft: '1rem',
  paddingLeft: '1rem'
}

const Brand = () => (
  <Block display="flex" flexDirection={"column"} padding="1rem" marginTop="1rem">
    <StyledLink style={{ textDecoration: 'none', textAlign: 'center' }} href="/">
      <H6 color="white" marginTop="1rem" marginLeft="5px" marginBottom="2rem">Teamkatalog</H6>
    </StyledLink>
  </Block>
)

const SideBar = () => {
  return (
    <Block {...sideBarProps}>
      <Brand />
      <Block {...items}>
        <NavItem to="/productarea" text="Produktområder" />
        <NavItem to="/team" text="Teams" />
      </Block>
      <Block position="absolute" bottom="0" width="100%">
        <Block display="flex" justifyContent="center">
          <Block paddingBottom={theme.sizing.scale600} width="40%">
            <img src={NavLogo} alt='NAV logo' width="100%" />
          </Block>
        </Block>
        <a href="slack://channel?team=T5LNAMWNA&id=CG2S8D25D" style={{ textDecoration: 'none' }}>
          <Block display="flex" justifyContent="center" paddingBottom={theme.sizing.scale400} alignItems="center">
            <img src={SlackLogo} width="60px" alt="slack logo" />
            <Paragraph4 color={theme.colors.white}>#datajegerne </Paragraph4>
          </Block>
        </a>
        <a href="https://dataplattform.gitbook.io/nada/kataloger/teamkatalog" style={{ textDecoration: 'none' }} target="_blank">
          <Block display="flex" justifyContent="center" paddingBottom={theme.sizing.scale400} alignItems="center">
            <Paragraph4 color={theme.colors.white}>Dokumentasjon </Paragraph4>
          </Block>
        </a>
      </Block>
    </Block>
  )
}

export default SideBar
