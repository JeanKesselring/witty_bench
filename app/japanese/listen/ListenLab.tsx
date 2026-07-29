'use client'

/* The render prop that TextLab takes is a FUNCTION, and a function cannot
 * cross the server/client boundary — passing one from the page (a server
 * component) threw "Functions are not valid as a child of Client Components"
 * and 500'd the route. This thin client wrapper is where the closure is
 * created, so both sides of it are client code. */

import { TextLab } from '@/components/japanese/TextLab'
import { Listener } from '@/components/japanese/Listener'

export function ListenLab() {
  return <TextLab>{(text) => <Listener key={text.textId} text={text} />}</TextLab>
}
