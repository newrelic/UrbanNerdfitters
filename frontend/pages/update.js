import React from 'react'
import Link from 'next/link'
import UpdateItem from '../components/UpdateItem'

const Update = (props) => {
  return (
    <UpdateItem id={props.query.id} />
  )
}

export default Update;